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
		'bracha'       => 'הברכה שלך',
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
}

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
		echo '<td><b>' . ( null === $sum ? '–' : (int) $sum ) . '</b></td><td>' . esc_html( $status ) . '</td></tr>';
	}
	echo '</tbody><tfoot><tr><th>סה״כ במלאי</th><th colspan="' . count( $names ) . '"></th><th>' . (int) $grand . '</th><th></th></tr></tfoot></table>';
	echo '<p><button class="button button-primary button-large">שמירה</button></p></form></div>';
}
