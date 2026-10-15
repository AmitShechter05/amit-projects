<?php
/**
 * כרטיס מתנה (16.10.2026).
 *
 * האתר יוצר הזמנה עם מוצר וירטואלי GIFT300/500/750 (app/api/giftcard).
 * כשהיא שולמה:
 *   1. נוצר קוד: קופון בסכום קבוע, בלי הגבלת כתובת, בתוקף 5 שנים (צו
 *      הגנת הצרכן - שוברי מתנה). הקוד נשמר על ההזמנה.
 *   2. למקבל נשלח מייל מעוצב בתאריך שהקונה בחר (09:00), ולקונה עותק מיד.
 *   3. כשמשתמשים בקוד, הסכום שנוצל יורד ממנו - והיתרה נשארת לפעם הבאה.
 *
 * מייל הכרטיס הוא שליחה שהקונה ביקש, לא דיוור, ולכן בלי "פרסומת".
 */

defined( 'ABSPATH' ) || exit;

define( 'MIKRA_GIFT_YEARS', 5 );

/** שורת כרטיס המתנה בהזמנה, או null */
function mikra_gift_item( $order ) {
	foreach ( $order->get_items() as $item ) {
		$p = is_callable( array( $item, 'get_product' ) ) ? $item->get_product() : null;
		if ( $p && preg_match( '/^GIFT(\d+)$/', (string) $p->get_sku() ) ) {
			return $item;
		}
	}
	return null;
}

/** הזמנה שכולה כרטיס מתנה - בלי זרימות של אחרי משלוח */
function mikra_is_gift_order( $order ) {
	return 'giftcard' === $order->get_meta( '_mikra_source' );
}

add_action( 'woocommerce_order_status_processing', 'mikra_gift_on_paid', 30, 2 );
add_action( 'woocommerce_order_status_completed', 'mikra_gift_on_paid', 30, 2 );
function mikra_gift_on_paid( $order_id, $order = null ) {
	$order = ( $order instanceof WC_Order ) ? $order : wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}
	mikra_gift_spend( $order ); // הזמנה ששולמה בכרטיס מתנה - מורידים מהיתרה
	$item = mikra_gift_item( $order );
	if ( ! $item || $order->get_meta( '_mikra_gift_code' ) ) {
		return;
	}
	$amount = (float) $item->get_total() + (float) $item->get_total_tax();
	if ( $amount <= 0 && preg_match( '/^GIFT(\d+)$/', (string) $item->get_product()->get_sku(), $m ) ) {
		$amount = (float) $m[1];
	}
	$code = mikra_gift_make_code( $amount, $order );
	if ( ! $code ) {
		$order->add_order_note( 'כרטיס מתנה: יצירת הקוד נכשלה. צריך ליצור קופון ידנית.' );
		return;
	}
	$order->update_meta_data( '_mikra_gift_code', $code );
	$order->save();
	$order->add_order_note( 'כרטיס מתנה: נוצר הקוד ' . $code . ' על ₪' . (int) $amount . '.' );

	// מתי לשלוח למקבל: בתאריך שנבחר ב-09:00 שעון ישראל, או עכשיו
	$date = (string) $order->get_meta( '_mikra_gift_date' );
	$at   = time();
	if ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date ) ) {
		$d = DateTime::createFromFormat( 'Y-m-d H:i', $date . ' 09:00', new DateTimeZone( 'Asia/Jerusalem' ) );
		if ( $d && $d->getTimestamp() > time() ) {
			$at = $d->getTimestamp();
		}
	}
	if ( $at > time() + 60 ) {
		wp_schedule_single_event( $at, 'mikra_gift_send', array( (int) $order->get_id() ) );
	} else {
		mikra_gift_send( (int) $order->get_id() );
	}
	mikra_gift_buyer_copy( $order, $code, $amount, $at );
}

function mikra_gift_make_code( $amount, $order ) {
	if ( ! class_exists( 'WC_Coupon' ) ) {
		return '';
	}
	$chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	$tail  = '';
	for ( $i = 0; $i < 8; $i++ ) {
		$tail .= $chars[ random_int( 0, strlen( $chars ) - 1 ) ] . ( 3 === $i ? '-' : '' );
	}
	$code = 'GIFT-' . $tail;
	$c    = new WC_Coupon();
	$c->set_code( strtolower( $code ) );
	$c->set_discount_type( 'fixed_cart' );
	$c->set_amount( $amount );
	$c->set_individual_use( false );
	$c->set_date_expires( strtotime( '+' . MIKRA_GIFT_YEARS . ' years' ) );
	$c->set_description( 'כרטיס מתנה · הזמנה #' . $order->get_order_number() . ' · ₪' . (int) $amount . ' · נוצר אוטומטית' );
	$c->update_meta_data( '_mikra_giftcard', 1 );
	$c->update_meta_data( '_mikra_gift_original', $amount );
	$c->update_meta_data( '_mikra_gift_order', $order->get_id() );
	$c->save();
	return $c->get_id() ? $code : '';
}

/** הזמנה ששולמה בקוד של כרטיס מתנה: הסכום שנוצל יורד מהקוד */
function mikra_gift_spend( $order ) {
	if ( $order->get_meta( '_mikra_gift_spent' ) ) {
		return;
	}
	$done = false;
	foreach ( $order->get_items( 'coupon' ) as $ci ) {
		$c = new WC_Coupon( $ci->get_code() );
		if ( ! $c->get_id() || ! $c->get_meta( '_mikra_giftcard' ) ) {
			continue;
		}
		$used = (float) $ci->get_discount() + (float) $ci->get_discount_tax();
		$left = max( 0, (float) $c->get_amount() - $used );
		$c->set_amount( $left );
		if ( $left <= 0 ) {
			$c->set_date_expires( time() ); // נוצל עד הסוף
		}
		$c->save();
		$order->add_order_note( 'כרטיס מתנה ' . strtoupper( $ci->get_code() ) . ': נוצלו ₪' . round( $used ) . ', נשארו ₪' . round( $left ) . '.' );
		$done = true;
	}
	if ( $done ) {
		$order->update_meta_data( '_mikra_gift_spent', time() );
		$order->save();
	}
}

/** הכרטיס עצמו: סכום גדול והקוד */
function mikra_gift_card_block( $code, $amount, $until ) {
	return '<tr><td class="mk-pad" style="padding:30px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#1d1a16;border-radius:14px;"><tr>'
		. '<td align="right" style="padding:30px 30px 28px;text-align:right;direction:rtl;">'
		. mk_text( 'מִקְרָא · כרטיס מתנה', 13, 700, '#c9a35a' )
		. mk_text( '<span dir="ltr">₪' . (int) $amount . '</span>', 54, 800, '#fbf8f1', 'line-height:1.1;margin-top:10px;' )
		. mk_text( 'הקוד שלך', 13, 300, '#d8d2c4', 'margin-top:18px;' )
		. mk_text( '<span dir="ltr">' . esc_html( $code ) . '</span>', 26, 800, '#fbf8f1', 'letter-spacing:2px;margin-top:2px;' )
		. mk_text( 'מקלידים בקופה · בתוקף עד ' . esc_html( $until ), 12, 400, '#d8d2c4', 'margin-top:6px;' )
		. '</td></tr></table></td></tr>';
}

add_action( 'mikra_gift_send', 'mikra_gift_send' );
function mikra_gift_send( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( ! $order || $order->get_meta( '_mikra_gift_sent' ) ) {
		return;
	}
	$code   = (string) $order->get_meta( '_mikra_gift_code' );
	$to     = (string) $order->get_meta( '_mikra_gift_to_email' );
	$toName = (string) $order->get_meta( '_mikra_gift_to_name' );
	$from   = (string) $order->get_meta( '_mikra_gift_from' );
	$msg    = (string) $order->get_meta( '_mikra_gift_message' );
	$c      = new WC_Coupon( strtolower( $code ) );
	if ( ! $code || ! $to || ! $c->get_id() ) {
		return;
	}
	$amount = (float) $c->get_meta( '_mikra_gift_original' );
	$until  = $c->get_date_expires() ? wp_date( 'j.n.Y', $c->get_date_expires()->getTimestamp() ) : '';
	$shop   = MIKRA_SITE . '/catalog?utm_source=email&utm_medium=giftcard';
	$hi     = $toName ? 'שלום ' . esc_html( $toName ) . ',' : 'שלום,';

	$rows = mk_topbar( 'כרטיס מתנה' )
		. mk_heading( $from ? esc_html( $from ) . ' שלחו לך מתנה' : 'מישהו שלח לך מתנה', 'קיבלת', 'כרטיס מתנה.', $hi . ' אפשר לבחור איתו כל תכשיט באתר, ועליו את הברכה שמתאימה לך.', 46 )
		. ( $msg ? mk_note( $from ? 'כמה מילים מ' . esc_html( $from ) : 'כמה מילים בשבילך', nl2br( esc_html( $msg ) ) ) : '' )
		. mikra_gift_card_block( strtoupper( $code ), $amount, $until )
		. mk_button( 'לבחירת תכשיט', $shop )
		. mk_para( 'איך זה עובד: בוחרים תכשיט ואת הברכה שתיחרט על השבב, ובקופה מקלידים את הקוד. אם התכשיט עולה פחות - היתרה נשארת על הקוד לפעם הבאה.', '30px 44px 0' )
		. mk_signoff( 'יש שאלה? עונים למייל הזה, ונשמח לעזור לבחור.' )
		. mk_footer( '', '', 'קיבלת את המייל כי ' . ( $from ? $from : 'מישהו' ) . ' שלח לך כרטיס מתנה ממִקְרָא.' );

	$subject = ( $from ? $from . ' שלחו לך' : 'קיבלת' ) . ' כרטיס מתנה ממִקְרָא';
	if ( mikra_send_html( $to, $subject, mk_wrap( $subject, 'כרטיס מתנה על ₪' . (int) $amount . '. הקוד בפנים.', $rows ) ) ) {
		$order->update_meta_data( '_mikra_gift_sent', time() );
		$order->save();
		$order->add_order_note( 'כרטיס המתנה נשלח ל-' . $to . '.' );
	}
}

function mikra_gift_buyer_copy( $order, $code, $amount, $at ) {
	$to     = $order->get_billing_email();
	$toName = (string) $order->get_meta( '_mikra_gift_to_name' );
	$when   = $at > time() + 60 ? 'ב-' . wp_date( 'j.n', $at ) . ' בבוקר' : 'עכשיו';
	$c      = new WC_Coupon( strtolower( $code ) );
	$until  = $c->get_date_expires() ? wp_date( 'j.n.Y', $c->get_date_expires()->getTimestamp() ) : '';
	$rows   = mk_topbar( 'הזמנה #' . $order->get_order_number() )
		. mk_heading( 'כרטיס המתנה מוכן', 'הכרטיס ל' . esc_html( $toName ), 'יוצא ' . esc_html( $when ) . '.', 'שלחנו אותו ל-<span dir="ltr">' . esc_html( (string) $order->get_meta( '_mikra_gift_to_email' ) ) . '</span>. זה עותק בשבילך - אפשר גם להעביר את הקוד בעצמך.', 40 )
		. mikra_gift_card_block( strtoupper( $code ), $amount, $until )
		. mk_signoff( 'משהו לא נכון בפרטים? עונים למייל הזה, ונתקן.' )
		. mk_footer( '', '', 'קיבלת את המייל כי הזמנת כרטיס מתנה באתר, הזמנה #' . $order->get_order_number() . '.' );
	$subject = 'כרטיס המתנה ל' . $toName . ' מוכן';
	mikra_send_html( $to, $subject, mk_wrap( $subject, 'הקוד והפרטים בפנים.', $rows ) );
}
