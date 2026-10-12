<?php
/**
 * תזכורת לתשלום שלא הושלם ("עגלה נטושה"), בעיצוב של סדרת ההצטרפות
 * (פיגמה, 12.10.2026): פס עליון, כותרת בניגוד משקלים, התכשיט שבעגלה
 * בגדול, כפתור לתשלום, העדשה, שורת אמון וחתימה.
 *
 * זה מייל שירות על הזמנה שהלקוח התחיל, ולכן בלי "פרסומת" ובלי הסרה -
 * אבל עם פרטי העסק בתחתית.
 *
 * @var WC_Order $order
 * @var string   $email_heading
 * @var WC_Email $email
 */

defined( 'ABSPATH' ) || exit;

$mikra_first = $order->get_billing_first_name();
$mikra_hi    = $mikra_first ? 'שלום ' . esc_html( $mikra_first ) . ', ' : 'שלום, ';
$mikra_pay   = mikra_store_pay_url( $order );

$mikra_items = '';
foreach ( $order->get_items() as $mikra_item ) {
	$mikra_img      = mikra_store_item_image( $mikra_item );
	$mikra_blessing = (string) $mikra_item->get_meta( 'הברכה', true );
	$mikra_qty      = (int) $mikra_item->get_quantity();
	$mikra_items   .= '<tr><td style="padding:0 0 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#ffffff;"><tr>'
		. '<td width="190" style="vertical-align:middle;">' . ( $mikra_img ? '<img src="' . esc_url( $mikra_img ) . '" width="190" alt="" style="display:block;width:190px;height:auto;border:0;">' : '' ) . '</td>'
		. '<td align="right" style="vertical-align:middle;text-align:right;padding:18px 26px;">'
		. mk_text( esc_html( $mikra_item->get_name() ) . ( $mikra_qty > 1 ? ' <span style="font-weight:300;color:#8a877c;">× ' . $mikra_qty . '</span>' : '' ), 22, 800, '#16150f', 'line-height:1.2;' )
		. ( '' !== $mikra_blessing ? mk_text( 'ברכה: ' . esc_html( $mikra_blessing ), 14, 300, '#4a4840', 'margin-top:6px;' ) : '' )
		. mk_text( wp_kses_post( mikra_store_money( $mikra_item->get_subtotal(), $order ) ), 16, 500, '#16150f', 'margin-top:12px;' )
		. '</td></tr></table></td></tr>';
}

$mikra_rows = mk_topbar( 'ההזמנה שלך · #' . $order->get_order_number() )
	. mk_heading( 'שמרנו לך את ההזמנה', 'התכשיט שלך', 'עדיין מחכה.', $mikra_hi . 'התחלת להזמין ולא סיימת את התשלום. ההזמנה שמורה, עם הברכה שבחרת:', 50 )
	. '<tr><td class="mk-pad" style="padding:28px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">' . $mikra_items . '</table>'
	. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="border-top:1px solid #d9c7a3;margin-top:6px;"><tr>'
	. '<td align="right" style="padding-top:16px;text-align:right;">' . mk_text( 'סה״כ לתשלום', 15, 300, '#4a4840' ) . '</td>'
	. '<td align="left" style="padding-top:16px;text-align:left;">' . mk_text( wp_kses_post( mikra_store_money( $order->get_total(), $order ) ), 26, 800, '#16150f', 'text-align:left;' ) . '</td>'
	. '</tr></table></td></tr>'
	. mk_button( 'להשלמת התשלום', $mikra_pay, '30px 40px 0' )
	. mk_row( mk_text( 'כרטיס אשראי, bit, Apple Pay או Google Pay · עד 5 תשלומים', 12, 400, '#8a877c', 'text-align:center;' ), '14px 40px 0' )
	. mk_lens_block( 'מה שתקבלו', 'הברכה שבחרת,<br>על שבב של <span dir="ltr">5</span> מ״מ.', 'חורטים אותה לפי ההזמנה, ובודקים מול הטקסט המקורי, אות אחרי אות. בעדשה: צילום אמיתי של שבב במיקרוסקופ.' )
	. mk_trust()
	. mk_signoff( 'יש שאלה לפני שמשלמים? על הברכה, המידה או המשלוח - פשוט עונים למייל הזה, או כותבים לנו <a href="' . esc_url( mikra_store_wa_url( $order ) ) . '" style="color:#96661c;font-weight:500;">בוואטסאפ</a>.' )
	. mk_footer();

echo mk_wrap( $email_heading, 'ההזמנה #' . $order->get_order_number() . ' שמורה, עם הברכה שבחרת.', $mikra_rows ); // phpcs:ignore WordPress.Security.EscapeOutput
