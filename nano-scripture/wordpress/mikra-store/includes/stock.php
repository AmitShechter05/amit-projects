<?php
/**
 * מלאי לפי ברכה.
 *
 * במחסן, שבב עם "אשת חיל" ושבב עם "שמירה והגנה" הם שני דברים שונים
 * (ספירה של עמית, 15.10.2026: 415 יחידות). ווקומרס סופר רק לפי מוצר,
 * ולכן הפירוט לברכות נשמר על המוצר עצמו, במפתח `_mikra_stock`:
 *   {"parnasa":14,"bracha":6,"shmira":10}
 * והמלאי הכולל של ווקומרס (manage_stock) הוא תמיד הסכום שלו.
 *
 *   - הזמנה ששולמה: ווקומרס מוריד את הכולל, וכאן יורדת הברכה שנבחרה
 *     (מזהה הברכה בשורת ההזמנה: `_mikra_blessing_id`).
 *   - הזמנה שבוטלה: ווקומרס מחזיר את הכולל, וכאן חוזרת הברכה.
 *   - המסך "מקרא · מלאי" (ווקומרס ← מקרא · מלאי): עדכון ידני.
 *
 * האתר קורא את המפתח יחד עם המחירים (lib/livePrices.ts), מסמן "אזל"
 * לברכה שנגמרה, ובודק שוב בקופה לפני שהוא יוצר הזמנה.
 */

defined( 'ABSPATH' ) || exit;

/** הברכות, בסדר העמודות במסך */
function mikra_stock_blessings() {
	return array(
		'parnasa'      => 'ברכת הפרנסה',
		'bracha'       => 'אשריך וטוב לך',
		'shmira'       => 'שמירה והגנה',
		'eshet-chayil' => 'אשת חיל',
		'tinok'        => 'ברכת התינוק',
	);
}

/** הפירוט של מוצר, או null אם אין לו פירוט */
function mikra_stock_get( $product ) {
	$raw = $product ? $product->get_meta( '_mikra_stock', true ) : '';
	$map = is_array( $raw ) ? $raw : json_decode( (string) $raw, true );
	if ( ! is_array( $map ) ) {
		return null;
	}
	$out = array();
	foreach ( $map as $k => $v ) {
		$out[ (string) $k ] = max( 0, (int) $v );
	}
	return $out;
}

/**
 * שומר פירוט ומעדכן את הכולל של ווקומרס לסכום שלו. פירוט ריק = המלאי
 * של המוצר לא מנוהל (אין הגבלה).
 */
function mikra_stock_set( $product, $map ) {
	$before = mikra_stock_get( $product );
	if ( empty( $map ) ) {
		$product->delete_meta_data( '_mikra_stock' );
		$product->set_manage_stock( false );
		$product->set_stock_status( 'instock' );
		$product->save();
		return;
	}
	$product->update_meta_data( '_mikra_stock', wp_json_encode( $map ) );
	$product->set_manage_stock( true );
	$product->set_stock_quantity( array_sum( $map ) );
	$product->save(); // ווקומרס קובע לבד "במלאי" / "אזל" לפי הכמות

	// ברכה שחזרה מאפס - מודיעים למי שביקש
	foreach ( $map as $bid => $qty ) {
		$was = is_array( $before ) && isset( $before[ $bid ] ) ? (int) $before[ $bid ] : 0;
		if ( $qty > 0 && $was <= 0 ) {
			mikra_notify_send( $product, (string) $bid );
		}
	}
}

/* ------------------------------------------------------------------
 * "תודיעו לי כשחוזר"
 * ------------------------------------------------------------------
 *
 * האתר שולח לכאן בקשה (POST wc/mikra/notify {sku, blessing, email})
 * כשברכה אזלה. כשהמלאי שלה עולה מאפס - נשלח מייל אחד, והבקשה נמחקת.
 * זה מייל שהלקוח ביקש במפורש, על תכשיט מסוים, ולכן זו הודעת שירות
 * ולא דיוור: בלי "פרסומת" ובלי הוספה לרשימה.
 */

function mikra_notify_list() {
	$l = get_option( 'mikra_notify', array() );
	return is_array( $l ) ? $l : array();
}

function mikra_notify_add( $sku, $bid, $email ) {
	$list = mikra_notify_list();
	foreach ( $list as $r ) {
		if ( $r['s'] === $sku && $r['b'] === $bid && $r['e'] === $email ) {
			return false;
		}
	}
	$list[] = array( 's' => $sku, 'b' => $bid, 'e' => $email, 't' => time() );
	update_option( 'mikra_notify', array_slice( $list, -3000 ), false );
	return true;
}

/** כמה מחכים לכל ברכה של מק״ט */
function mikra_notify_counts( $sku ) {
	$out = array();
	foreach ( mikra_notify_list() as $r ) {
		if ( $r['s'] === $sku ) {
			$out[ $r['b'] ] = ( isset( $out[ $r['b'] ] ) ? $out[ $r['b'] ] : 0 ) + 1;
		}
	}
	return $out;
}

function mikra_notify_send( $product, $bid ) {
	$sku   = (string) $product->get_sku();
	$list  = mikra_notify_list();
	$wait  = mikra_notify_counts( $sku );
	if ( empty( $wait[ $bid ] ) ) {
		return; // אף אחד לא מחכה לברכה הזו
	}
	$keep  = array();
	$names = mikra_stock_blessings();
	$bname = isset( $names[ $bid ] ) ? $names[ $bid ] : $bid;
	$url   = MIKRA_SITE . '/products/' . $product->get_slug() . '?b=' . rawurlencode( $bid ) . '&utm_source=email&utm_medium=restock';
	$sent  = 0;
	foreach ( $list as $r ) {
		if ( $r['s'] !== $sku || $r['b'] !== $bid ) {
			$keep[] = $r;
			continue;
		}
		$subject = 'חזר למלאי: ' . $product->get_name() . ' עם ' . $bname;
		$img     = MIKRA_SITE . '/products/' . $sku . '.jpg';
		$rows    = mk_topbar( 'חזר למלאי' )
			. mk_heading( 'ביקשת שנודיע לך', $product->get_name(), 'חזר למלאי.', 'עם ' . esc_html( $bname ) . '. הכמות מוגבלת, אז אם רוצים - כדאי לא לחכות הרבה.', 44 )
			. '<tr><td align="center" style="padding:24px 40px 0;"><a href="' . esc_url( $url ) . '"><img src="' . esc_url( $img ) . '" width="300" alt="' . esc_attr( $product->get_name() ) . '" style="display:block;width:300px;height:auto;border:0;"></a></td></tr>'
			. mk_button( 'לתכשיט', $url )
			. mk_footer( '', '', 'קיבלת את המייל כי ביקשת באתר שנודיע לך כשהתכשיט חוזר. זה המייל היחיד על כך.' );
		if ( mikra_send_html( $r['e'], $subject, mk_wrap( $subject, $product->get_name() . ' עם ' . $bname . ' זמין שוב.', $rows ) ) ) {
			$sent++;
		}
	}
	update_option( 'mikra_notify', $keep, false );
	if ( $sent && function_exists( 'mikra_log' ) ) {
		mikra_log( 'sent', '', '', 0, 'חזר למלאי: ' . $product->get_name() . ' עם ' . $bname . ' - נשלחו ' . $sent );
	}
}

add_action( 'rest_api_init', function () {
	register_rest_route(
		'wc/mikra',
		'/notify',
		array(
			'methods'             => 'POST',
			'permission_callback' => function () {
				return current_user_can( 'manage_woocommerce' );
			},
			'callback'            => function ( $req ) {
				$sku   = sanitize_text_field( (string) $req->get_param( 'sku' ) );
				$bid   = sanitize_key( (string) $req->get_param( 'blessing' ) );
				$email = sanitize_email( (string) $req->get_param( 'email' ) );
				if ( ! $sku || ! $bid || ! is_email( $email ) ) {
					return new WP_Error( 'mikra_notify', 'missing fields', array( 'status' => 400 ) );
				}
				return array( 'ok' => true, 'new' => mikra_notify_add( $sku, $bid, strtolower( $email ) ) );
			},
		)
	);
} );

/** משנה את הברכות של שורות ההזמנה ב-$sign (‎-1 הורדה, ‎+1 החזרה) */
function mikra_stock_apply_order( $order, $sign ) {
	$changed = array();
	foreach ( $order->get_items() as $item ) {
		$product = is_callable( array( $item, 'get_product' ) ) ? $item->get_product() : null;
		$bid     = (string) $item->get_meta( '_mikra_blessing_id', true );
		$map     = $product ? mikra_stock_get( $product ) : null;
		if ( ! $product || null === $map || '' === $bid ) {
			continue;
		}
		$qty         = (int) $item->get_quantity();
		$map[ $bid ] = max( 0, ( isset( $map[ $bid ] ) ? (int) $map[ $bid ] : 0 ) + $sign * $qty );
		mikra_stock_set( $product, $map );
		$names     = mikra_stock_blessings();
		$changed[] = $product->get_name() . ' · ' . ( isset( $names[ $bid ] ) ? $names[ $bid ] : $bid ) . ': ' . $map[ $bid ];
	}
	if ( $changed ) {
		$order->add_order_note( ( $sign < 0 ? 'מלאי לפי ברכה ירד. נשאר - ' : 'מלאי לפי ברכה הוחזר. עכשיו - ' ) . implode( ', ', $changed ) );
	}
}

// ווקומרס מסמן בעצמו שהמלאי של ההזמנה כבר ירד/הוחזר, ולכן אין כפילות
add_action( 'woocommerce_reduce_order_stock', function ( $order ) {
	mikra_stock_apply_order( $order, -1 );
} );
add_action( 'woocommerce_restore_order_stock', function ( $order ) {
	mikra_stock_apply_order( $order, 1 );
} );

/* ------------------------------------------------------------------
 * המסך: ווקומרס ← מקרא · מלאי
 * ------------------------------------------------------------------ */

add_action( 'admin_menu', function () {
	add_submenu_page( 'woocommerce', 'מקרא · מלאי', 'מקרא · מלאי', 'manage_woocommerce', 'mikra-stock', 'mikra_stock_page' );
}, 61 );

function mikra_stock_products() {
	$list = wc_get_products( array( 'limit' => -1, 'status' => array( 'publish', 'private' ), 'orderby' => 'title', 'order' => 'ASC' ) );
	return array_values( array_filter( $list, function ( $p ) {
		return '' !== (string) $p->get_sku() && 0 !== strpos( (string) $p->get_sku(), 'TEST' );
	} ) );
}

function mikra_stock_page() {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	$names = mikra_stock_blessings();
	echo '<div class="wrap" dir="rtl" style="max-width:1200px"><h1>מקרא · מלאי לפי ברכה</h1>';

	if ( isset( $_POST['mikra_stock'] ) && check_admin_referer( 'mikra_stock' ) ) {
		$posted = (array) wp_unslash( $_POST['mikra_stock'] );
		$n      = 0;
		foreach ( mikra_stock_products() as $p ) {
			$row = isset( $posted[ $p->get_id() ] ) ? (array) $posted[ $p->get_id() ] : array();
			$map = array();
			foreach ( array_keys( $names ) as $bid ) {
				$v = isset( $row[ $bid ] ) ? trim( (string) $row[ $bid ] ) : '';
				if ( '' !== $v ) {
					$map[ $bid ] = max( 0, (int) $v );
				}
			}
			if ( $map !== mikra_stock_get( $p ) && ! ( empty( $map ) && null === mikra_stock_get( $p ) ) ) {
				mikra_stock_set( $p, $map );
				$n++;
			}
		}
		echo '<div class="notice notice-success"><p>נשמר. עודכנו ' . (int) $n . ' מוצרים. באתר זה מופיע תוך עד 5 דקות.</p></div>';
	}

	echo '<p>כמה יחידות יש מכל ברכה לכל תכשיט. <b>משבצת ריקה</b> = הברכה לא נמכרת על התכשיט הזה. <b>0</b> = אזלה (באתר: "אזל מהמלאי"). בכל הזמנה ששולמה המספר יורד לבד, ובביטול הוא חוזר.</p>';
	echo '<style>.mk-st input{width:64px;text-align:center}.mk-st td,.mk-st th{text-align:center;vertical-align:middle}.mk-st td:first-child,.mk-st th:first-child{text-align:right}.mk-low{background:#fff4e5!important}.mk-zero{background:#fde8e8!important}</style>';
	echo '<form method="post">';
	wp_nonce_field( 'mikra_stock' );
	echo '<table class="widefat striped mk-st"><thead><tr><th>תכשיט</th>';
	foreach ( $names as $label ) {
		echo '<th>' . esc_html( $label ) . '</th>';
	}
	echo '<th>סה״כ</th><th>באתר</th></tr></thead><tbody>';
	$grand = 0;
	foreach ( mikra_stock_products() as $p ) {
		$map  = mikra_stock_get( $p );
		$fin  = (string) $p->get_meta( '_mikra_finish', true );
		$sum  = $map ? array_sum( $map ) : null;
		$grand += (int) $sum;
		echo '<tr><td><b>' . esc_html( $p->get_name() ) . '</b>' . ( $fin ? ' · ' . esc_html( $fin ) : '' ) . '<br><small dir="ltr">' . esc_html( $p->get_sku() ) . '</small></td>';
		foreach ( array_keys( $names ) as $bid ) {
			$has = is_array( $map ) && array_key_exists( $bid, $map );
			$v   = $has ? (int) $map[ $bid ] : '';
			$cls = $has ? ( 0 === $v ? 'mk-zero' : ( $v <= 3 ? 'mk-low' : '' ) ) : '';
			echo '<td class="' . esc_attr( $cls ) . '"><input type="number" min="0" name="mikra_stock[' . (int) $p->get_id() . '][' . esc_attr( $bid ) . ']" value="' . esc_attr( (string) $v ) . '"></td>';
		}
		$status = 'private' === $p->get_status() ? 'מוסתר' : ( null === $sum ? 'לא מנוהל' : ( $sum > 0 ? 'במלאי' : 'אזל' ) );
		$wait   = mikra_notify_counts( (string) $p->get_sku() );
		if ( $wait ) {
			$parts = array();
			foreach ( $wait as $wb => $wn ) {
				$parts[] = ( isset( $names[ $wb ] ) ? $names[ $wb ] : $wb ) . ': ' . (int) $wn;
			}
			$status .= '<br><small>מחכים שיחזור - ' . esc_html( implode( ', ', $parts ) ) . '</small>';
		}
		echo '<td><b>' . ( null === $sum ? '–' : (int) $sum ) . '</b></td><td>' . wp_kses_post( $status ) . '</td></tr>';
	}
	echo '</tbody><tfoot><tr><th>סה״כ במלאי</th><th colspan="' . count( $names ) . '"></th><th>' . (int) $grand . '</th><th></th></tr></tfoot></table>';
	echo '<p><button class="button button-primary button-large">שמירה</button></p></form></div>';
}
