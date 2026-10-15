<?php
/**
 * עגלה נטושה - לפני הקופה (16.10.2026).
 *
 * העגלה של mikra.shop חיה בדפדפן. כשהאתר יודע מי הגולש (נרשם בפופאפ,
 * או כבר הקליד מייל בקופה), הוא שולח לכאן את העגלה בכל שינוי
 * (POST wc/mikra/cart). אם אין הזמנה תוך שעה - מייל ראשון; למחרת 19:30 -
 * מייל שני; ואז נגמר. בכל מייל קישור שממלא את העגלה בחזרה בדיוק כמו שהייתה.
 *
 * הזרימה נעצרת כשנוצרת הזמנה לאותה כתובת (ואז זרימת הנטישה של הקופה,
 * flows.php, היא שממשיכה), כשהעגלה מתרוקנת, או כשאין הסכמה לדיוור.
 * אותם כללים כמו כל השאר: חלון שליחה, שבת וחג, מייל אחד ביום.
 */

defined( 'ABSPATH' ) || exit;

function mikra_carts() {
	$c = get_option( 'mikra_carts', array() );
	return is_array( $c ) ? $c : array();
}

function mikra_carts_save( $c ) {
	// לא שומרים עגלות ישנות מחודש
	foreach ( $c as $k => $v ) {
		if ( (int) $v['t'] < time() - 30 * DAY_IN_SECONDS ) {
			unset( $c[ $k ] );
		}
	}
	update_option( 'mikra_carts', $c, false );
}

add_action( 'rest_api_init', function () {
	register_rest_route(
		'wc/mikra',
		'/cart',
		array(
			'methods'             => 'POST',
			'permission_callback' => function () {
				return current_user_can( 'manage_woocommerce' );
			},
			'callback'            => function ( $req ) {
				$email = strtolower( sanitize_email( (string) $req->get_param( 'email' ) ) );
				if ( ! is_email( $email ) ) {
					return new WP_Error( 'mikra_cart', 'bad email', array( 'status' => 400 ) );
				}
				$lines = array();
				foreach ( array_slice( (array) $req->get_param( 'lines' ), 0, 20 ) as $l ) {
					$l = (array) $l;
					$lines[] = array(
						'slug'     => sanitize_title( (string) ( $l['slug'] ?? '' ) ),
						'sku'      => sanitize_text_field( (string) ( $l['sku'] ?? '' ) ),
						'name'     => sanitize_text_field( (string) ( $l['name'] ?? '' ) ),
						'blessing' => sanitize_key( (string) ( $l['blessing'] ?? '' ) ),
						'bname'    => sanitize_text_field( (string) ( $l['blessingName'] ?? '' ) ),
						'qty'      => max( 1, min( 20, (int) ( $l['qty'] ?? 1 ) ) ),
						'price'    => max( 0, (float) ( $l['price'] ?? 0 ) ),
					);
				}
				mikra_cart_update( $email, $lines, sanitize_text_field( (string) $req->get_param( 'name' ) ) );
				return array( 'ok' => true );
			},
		)
	);
} );

function mikra_cart_update( $email, $lines, $name = '' ) {
	$carts = mikra_carts();
	$k     = mikra_ekey( $email );
	if ( empty( $lines ) ) {
		unset( $carts[ $k ] );
		mikra_carts_save( $carts );
		return;
	}
	$prev        = isset( $carts[ $k ] ) ? $carts[ $k ] : array();
	$carts[ $k ] = array(
		'e'     => $email,
		'n'     => $name ? $name : ( isset( $prev['n'] ) ? $prev['n'] : '' ),
		'lines' => $lines,
		't'     => time(),
		'sent'  => array(), // עגלה ששונתה מתחילה מחדש
	);
	mikra_carts_save( $carts );
	// מייל ראשון שעה אחרי השינוי האחרון. שינוי חדש דוחה את הקודם
	wp_clear_scheduled_hook( 'mikra_flow', array( 'cart', $k, 1 ) );
	wp_clear_scheduled_hook( 'mikra_flow', array( 'cart', $k, 2 ) );
	mikra_flow_schedule( 'cart', $k, 1, time() + HOUR_IN_SECONDS );
}

/** הזמנה חדשה לאותה כתובת - העגלה עברה לקופה, וזרימת הקופה ממשיכה */
add_action( 'woocommerce_new_order', function ( $order_id, $order = null ) {
	$order = ( $order instanceof WC_Order ) ? $order : wc_get_order( $order_id );
	if ( $order && $order->get_billing_email() ) {
		$carts = mikra_carts();
		$k     = mikra_ekey( $order->get_billing_email() );
		if ( isset( $carts[ $k ] ) ) {
			unset( $carts[ $k ] );
			mikra_carts_save( $carts );
			mikra_unschedule( 'cart', $k, array( 1, 2 ) );
		}
	}
}, 15, 2 );

add_action( 'mikra_flow', function ( $flow, $key, $step ) {
	if ( 'cart' === $flow ) {
		mikra_cart_run( (string) $key, (int) $step );
	}
}, 10, 3 );

function mikra_cart_run( $k, $step ) {
	$carts = mikra_carts();
	if ( empty( $carts[ $k ] ) || ! empty( $carts[ $k ]['sent'][ $step ] ) ) {
		return;
	}
	$cart  = $carts[ $k ];
	$email = $cart['e'];
	// קנה בינתיים
	$orders = wc_get_orders( array( 'customer' => $email, 'limit' => 1, 'orderby' => 'date', 'order' => 'DESC' ) );
	if ( $orders && $orders[0]->get_date_created() && $orders[0]->get_date_created()->getTimestamp() > (int) $cart['t'] ) {
		unset( $carts[ $k ] );
		mikra_carts_save( $carts );
		return;
	}
	if ( ! mikra_consent( $email ) ) {
		return;
	}
	if ( mikra_flow_defer( 'cart', $k, $step, $email ) ) {
		return;
	}
	$unsub = mikra_unsub_email_url( $email );
	$mail  = mikra_cart_email( $step, $cart, $unsub );
	if ( $mail && mikra_send_html( $email, $mail[0], $mail[1], $unsub ) ) {
		$carts[ $k ]['sent'][ $step ] = time();
		mikra_carts_save( $carts );
		mikra_mark_sent( $email );
		mikra_log( 'sent', 'cart', $email, 0, $mail[0] );
	}
	if ( 1 === $step ) {
		mikra_flow_schedule( 'cart', $k, 2, mikra_day_at( time(), 1, '19:30' ) );
	}
}

/** קישור שממלא את העגלה בחזרה (components/CartSync.tsx קורא אותו) */
function mikra_cart_restore_url( $lines, $campaign ) {
	$parts = array();
	foreach ( $lines as $l ) {
		$parts[] = $l['slug'] . ':' . $l['blessing'] . ':' . (int) $l['qty'];
	}
	return MIKRA_SITE . '/?restore=' . rawurlencode( implode( '~', $parts ) ) . '&utm_source=email&utm_medium=cart&utm_campaign=' . $campaign;
}

function mikra_cart_email( $step, $cart, $unsub ) {
	$name  = (string) $cart['n'];
	$hi    = $name ? 'שלום ' . esc_html( $name ) . ', ' : 'שלום, ';
	$url   = mikra_cart_restore_url( $cart['lines'], 'cart-' . $step );
	$items = '';
	$total = 0;
	foreach ( $cart['lines'] as $l ) {
		$total += $l['price'] * $l['qty'];
		$img    = MIKRA_SITE . '/products/' . rawurlencode( $l['sku'] ) . '.jpg';
		$items .= '<tr><td style="padding:0 0 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#ffffff;"><tr>'
			. '<td width="150" style="vertical-align:middle;"><a href="' . esc_url( $url ) . '"><img src="' . esc_url( $img ) . '" width="150" alt="" style="display:block;width:150px;height:auto;border:0;"></a></td>'
			. '<td align="right" style="vertical-align:middle;text-align:right;padding:16px 24px;direction:rtl;">'
			. mk_text( esc_html( $l['name'] ) . ( $l['qty'] > 1 ? ' <span style="font-weight:300;color:#6f6c62;">× ' . (int) $l['qty'] . '</span>' : '' ), 19, 800, '#16150f', 'line-height:1.2;' )
			. ( $l['bname'] ? mk_text( 'ברכה: ' . esc_html( $l['bname'] ), 13, 300, '#4a4840', 'margin-top:6px;' ) : '' )
			. ( $l['price'] ? mk_text( '<span dir="ltr">₪' . number_format( $l['price'] * $l['qty'] ) . '</span>', 15, 500, '#16150f', 'margin-top:10px;' ) : '' )
			. '</td></tr></table></td></tr>';
	}
	$cart_rows = '<tr><td class="mk-pad" style="padding:30px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">' . $items . '</table></td></tr>';
	$foot      = mk_footer( $unsub, 'כי אישרת דיוור' );

	if ( 1 === (int) $step ) {
		$rows    = mk_topbar( 'העגלה שלך' )
			. mk_heading( 'שמרנו לך', 'משהו נשאר', 'בעגלה.', $hi . 'בחרת תכשיט וברכה, ולא הגעת לקופה. הכול שמור, בדיוק כמו שהשארת.', 46 )
			. $cart_rows
			. mk_button( 'לחזור לעגלה', $url )
			. mk_signoff( 'מתלבטים על הברכה או על התכשיט? עונים למייל הזה, ונעזור לבחור.' );
		$subject = 'פרסומת: משהו נשאר בעגלה שלך';
		$pre     = 'התכשיט והברכה שבחרת שמורים לך.';
	} else {
		$rows    = mk_topbar( 'העגלה שלך' )
			. mk_heading( 'רק תזכורת', 'העגלה שלך', 'עדיין מחכה.', $hi . 'אם יש שאלה לפני שמזמינים - על הברכה, המידה או המשלוח - פשוט עונים למייל הזה. עונים אנשים, לא בוט.', 44 )
			. $cart_rows
			. mk_fact_boxes( array( array( 'עד 5', 'תשלומים' ), array( '2-4', 'ימי עסקים, מבוטח' ), array( '30 יום', 'להחזרה' ) ) )
			. mk_button( 'לחזור לעגלה', $url )
			. mk_signoff( 'זה המייל האחרון על העגלה הזו.' );
		$subject = 'פרסומת: העגלה שלך עדיין מחכה';
		$pre     = 'אם יש שאלה לפני שמזמינים - עונים כאן.';
	}
	return array( $subject, mk_wrap( $subject, $pre, $rows . $foot ) );
}
