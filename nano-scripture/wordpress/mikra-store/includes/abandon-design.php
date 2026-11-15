<?php
/**
 * העיצוב של מיילי הנטישה (16.11.2026, תוסף 1.7.0).
 *
 * עמית: "המייל של הנטישות עגלה נראה רע מאוד, רק מלל לא רואים תמונה".
 * שתי סיבות: התמונות הגדולות היו רקע של תא בטבלה (background), ו-Gmail
 * לא מציג אותן - יצא ריבוע שחור. והמיילים היו במיתוג הישן, שחור וזהב.
 *
 * כאן: אותם צבעים כמו באתר מ-12.11.2026 - חום #3B2418 לטקסט, קרם #F2E8DA
 * לרקע, תכלת #8EC5E6 רק לכפתור שמקדם לתשלום (ועליו כותבים בחום). כותרות
 * ב-Suez One, השאר ב-Heebo. כל תמונה היא <img> רגיל, לא רקע.
 * המבנה לפי סקיל ScaleUp (מודול 7): מסר אחד למייל, העגלה מיד מתחת
 * לפתיחה, כפתור אחד שחוזר, ובלוק אמון אחר בסוף כל מייל.
 *
 * רק עובדות קבועות: אין כאן "משלוח חינם" או מבצע זמני, כי הזרימה רצה
 * גם אחרי שמבצע נגמר. אין ביקורות או דירוג - עוד אין ביקורות מאושרות.
 */

defined( 'ABSPATH' ) || exit;

const MK2_INK   = '#3B2418';
const MK2_INK2  = '#5B4335';
const MK2_MUTED = '#7A6455';
const MK2_BG    = '#F2E8DA';
const MK2_CARD  = '#FBF6EF';
const MK2_LINE  = '#E2D2BA';
const MK2_BLUE  = '#8EC5E6';
const MK2_BODY  = "font-family:Heebo,Arial,'Segoe UI',Tahoma,sans-serif;";
const MK2_HEAD  = "font-family:'Suez One',Heebo,Arial,'Segoe UI',Tahoma,sans-serif;font-weight:400;";

function mk2_wrap( $title, $preheader, $rows ) {
	return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
		. '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' . esc_html( $title ) . '</title>'
		. '<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&family=Suez+One&display=swap" rel="stylesheet"><!--<![endif]-->'
		. '<!--[if mso]><style>*{font-family:Arial,sans-serif!important}</style><![endif]-->'
		. '<style>body{margin:0;padding:0;background:' . MK2_BG . '}a{text-decoration:none}'
		. '@media (max-width:620px){.mk2-wrap{width:100%!important}.mk2-pad{padding-left:16px!important;padding-right:16px!important}'
		. '.mk2-h1{font-size:40px!important}.mk2-col{display:block!important;width:100%!important}.mk2-big{font-size:96px!important}}</style></head>'
		. '<body dir="rtl" style="margin:0;padding:0;background:' . MK2_BG . ';">'
		. '<div style="display:none;max-height:0;overflow:hidden;">' . esc_html( $preheader ) . '</div>'
		. '<div dir="rtl" lang="he" style="direction:rtl;">'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_BG . ';"><tr><td align="center">'
		. '<table role="presentation" class="mk2-wrap" width="600" cellpadding="0" cellspacing="0" dir="rtl" lang="he" style="width:600px;max-width:600px;background:' . MK2_BG . ';direction:rtl;' . MK2_BODY . 'color:' . MK2_INK . ';">'
		. '<tr><td align="center" style="padding:28px 0 8px;"><a href="' . esc_url( MIKRA_SITE ) . '"><img src="' . esc_url( MIKRA_SITE . '/brand/mikra-logo-email.png' ) . '" width="124" alt="מִקְרָא" style="display:block;width:124px;height:auto;border:0;"></a></td></tr>'
		. $rows . '</table></td></tr></table></div></body></html>';
}

/** פתיחה: תגית, כותרת בשתי שורות (השנייה מסומנת), ושורה אחת */
function mk2_open( $pill, $line1, $mark, $sub_html ) {
	return '<tr><td class="mk2-pad" align="center" style="padding:26px 44px 0;text-align:center;">'
		. ( $pill ? '<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="border:1.5px solid ' . MK2_INK . ';border-radius:6px;padding:5px 14px;' . MK2_BODY . 'font-size:13px;font-weight:700;color:' . MK2_INK . ';">' . esc_html( $pill ) . '</td></tr></table>' : '' )
		. '<p class="mk2-h1" style="margin:20px 0 0;' . MK2_HEAD . 'font-size:50px;line-height:1.12;color:' . MK2_INK . ';">' . $line1 . ( $mark ? '<br><span style="background:' . MK2_LINE . ';padding:0 8px;border-radius:6px;">' . $mark . '</span>' : '' ) . '</p>'
		. ( $sub_html ? '<p style="margin:16px auto 0;max-width:470px;' . MK2_BODY . 'font-size:20px;line-height:1.5;font-weight:500;color:' . MK2_INK2 . ';">' . $sub_html . '</p>' : '' )
		. '</td></tr>';
}

/** מה שבהזמנה: תמונה, שם, ברכה, מחיר, וסה"כ - מתמלא מההזמנה */
function mk2_cart( $order, $kicker = 'מה שמחכה לך' ) {
	$items = '';
	foreach ( $order->get_items() as $item ) {
		$img      = mikra_store_item_image( $item );
		$blessing = (string) $item->get_meta( 'הברכה', true );
		$qty      = (int) $item->get_quantity();
		$items   .= '<tr><td style="padding:6px 24px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
			. '<td width="132" style="width:132px;vertical-align:middle;">' . ( $img ? '<img src="' . esc_url( $img ) . '" width="120" alt="' . esc_attr( $item->get_name() ) . '" style="display:block;width:120px;height:auto;border:0;border-radius:12px;background:#ffffff;">' : '' ) . '</td>'
			. '<td align="right" style="vertical-align:middle;padding-right:16px;text-align:right;">'
			. '<p style="margin:0;' . MK2_HEAD . 'font-size:24px;line-height:1.2;color:' . MK2_INK . ';">' . esc_html( $item->get_name() ) . ( $qty > 1 ? ' <span style="' . MK2_BODY . 'font-size:16px;color:' . MK2_MUTED . ';">× ' . $qty . '</span>' : '' ) . '</p>'
			. ( '' !== $blessing ? '<p style="margin:4px 0 0;' . MK2_BODY . 'font-size:15px;color:' . MK2_INK2 . ';">ברכה: ' . esc_html( $blessing ) . '</p>' : '' )
			. '<p style="margin:8px 0 0;' . MK2_BODY . 'font-size:18px;font-weight:700;color:' . MK2_INK . ';">' . wp_kses_post( mikra_store_money( $item->get_subtotal(), $order ) ) . '</p>'
			. '</td></tr></table></td></tr>';
	}
	return '<tr><td class="mk2-pad" style="padding:28px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_CARD . ';border-radius:20px;">'
		. '<tr><td align="right" style="padding:22px 24px 6px;' . MK2_BODY . 'font-size:13px;font-weight:700;color:#8A5A3B;text-align:right;">' . esc_html( $kicker ) . '</td></tr>'
		. $items
		. '<tr><td style="padding:0 24px;"><div style="height:1px;line-height:1px;font-size:0;background:' . MK2_LINE . ';">&nbsp;</div></td></tr>'
		. '<tr><td style="padding:14px 24px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
		. '<td align="right" style="' . MK2_BODY . 'font-size:15px;color:' . MK2_INK2 . ';text-align:right;">סה״כ לתשלום</td>'
		. '<td align="left" style="' . MK2_BODY . 'font-size:22px;font-weight:800;color:' . MK2_INK . ';text-align:left;">' . wp_kses_post( mikra_store_money( $order->get_total(), $order ) ) . '</td>'
		. '</tr></table></td></tr></table></td></tr>';
}

/** הכפתור שמקדם לתשלום - תכלת, כתוב בחום. שורת הבטחה מתחת אם יש */
function mk2_button( $label, $url, $promise = '', $pad = '26px 28px 0' ) {
	return '<tr><td align="center" style="padding:' . $pad . ';text-align:center;">'
		. '<a href="' . esc_url( $url ) . '" style="display:inline-block;background:' . MK2_BLUE . ';color:' . MK2_INK . ';' . MK2_BODY . 'font-size:18px;font-weight:800;text-decoration:none;padding:17px 52px;border-radius:10px;">' . esc_html( $label ) . '</a>'
		. ( $promise ? '<p style="margin:10px 0 0;' . MK2_BODY . 'font-size:13px;color:' . MK2_MUTED . ';">' . esc_html( $promise ) . '</p>' : '' )
		. '</td></tr>';
}

/** צ'קליסט עם תמונה בצד (בטלפון התמונה יורדת מתחת) */
function mk2_checklist( $title_html, $items, $img, $alt ) {
	$rows = '';
	$n    = count( $items );
	foreach ( $items as $i => $t ) {
		$pb    = $i < $n - 1 ? '10px' : '0';
		$rows .= '<tr><td style="vertical-align:top;padding:0 0 ' . $pb . ' 10px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:11px;background:' . MK2_INK . ';color:' . MK2_BG . ';font-size:13px;text-align:center;">✓</span></td>'
			. '<td align="right" style="padding:0 0 ' . $pb . ';' . MK2_BODY . 'font-size:16px;font-weight:500;color:' . MK2_INK . ';text-align:right;">' . esc_html( $t ) . '</td></tr>';
	}
	return '<tr><td class="mk2-pad" style="padding:40px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_CARD . ';border-radius:20px;"><tr>'
		. '<td class="mk2-col" width="52%" align="right" style="width:52%;vertical-align:middle;padding:26px 24px;text-align:right;">'
		. '<p style="margin:0 0 14px;' . MK2_HEAD . 'font-size:26px;line-height:1.2;color:' . MK2_INK . ';">' . $title_html . '</p>'
		. '<table role="presentation" cellpadding="0" cellspacing="0" dir="rtl">' . $rows . '</table></td>'
		. '<td class="mk2-col" width="48%" style="width:48%;vertical-align:middle;"><img src="' . esc_url( $img ) . '" width="260" alt="' . esc_attr( $alt ) . '" style="display:block;width:100%;height:auto;border:0;border-radius:0 0 0 20px;"></td>'
		. '</tr></table></td></tr>';
}

/** תמונה ברוחב מלא עם פינות, וכיתוב קטן מתחת */
function mk2_photo( $img, $alt, $caption = '' ) {
	return '<tr><td class="mk2-pad" style="padding:28px 28px 0;">'
		. '<img src="' . esc_url( $img ) . '" width="544" alt="' . esc_attr( $alt ) . '" style="display:block;width:100%;height:auto;border:0;border-radius:20px;">'
		. ( $caption ? '<p style="margin:10px 0 0;' . MK2_BODY . 'font-size:13px;color:' . MK2_MUTED . ';text-align:center;">' . esc_html( $caption ) . '</p>' : '' )
		. '</td></tr>';
}

/** שלבים עם אותיות (א/ב/ג/ד - בלי 01/02), כל שלב בשורה */
function mk2_steps( $title, $steps ) {
	$letters = array( 'א', 'ב', 'ג', 'ד', 'ה' );
	$rows    = '';
	foreach ( $steps as $i => $s ) {
		$rows .= '<tr><td width="44" style="width:44px;vertical-align:top;padding:0 0 16px;"><span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:17px;background:' . MK2_INK . ';color:' . MK2_BG . ';' . MK2_HEAD . 'font-size:17px;text-align:center;">' . $letters[ $i ] . '</span></td>'
			. '<td align="right" style="vertical-align:top;padding:0 12px 16px 0;text-align:right;">'
			. '<p style="margin:0;' . MK2_BODY . 'font-size:17px;font-weight:700;color:' . MK2_INK . ';">' . esc_html( $s[0] ) . '</p>'
			. '<p style="margin:2px 0 0;' . MK2_BODY . 'font-size:15px;line-height:1.5;color:' . MK2_INK2 . ';">' . esc_html( $s[1] ) . '</p></td></tr>';
	}
	return '<tr><td class="mk2-pad" style="padding:36px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_CARD . ';border-radius:20px;"><tr><td style="padding:26px 24px 12px;">'
		. '<p style="margin:0 0 18px;' . MK2_HEAD . 'font-size:26px;color:' . MK2_INK . ';text-align:right;">' . esc_html( $title ) . '</p>'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">' . $rows . '</table>'
		. '</td></tr></table></td></tr>';
}

/** ההצעה בראש המייל: מספר גדול, הקוד, ועד מתי */
function mk2_offer( $pct, $code, $lead, $small ) {
	return '<tr><td class="mk2-pad" style="padding:22px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_INK . ';border-radius:24px;"><tr><td align="center" style="padding:30px 24px;text-align:center;">'
		. '<p class="mk2-big" style="margin:0;' . MK2_HEAD . 'font-size:120px;line-height:1;color:' . MK2_BG . ';"><span dir="ltr">' . (int) $pct . '%</span></p>'
		. '<p style="margin:8px 0 0;' . MK2_BODY . 'font-size:18px;font-weight:500;color:#E9DDCB;">' . esc_html( $lead ) . '</p>'
		. ( $code ? '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-top:18px;"><tr><td style="border:2px dashed #C9B49A;border-radius:10px;padding:10px 26px;' . MK2_BODY . 'font-size:26px;font-weight:800;letter-spacing:2px;color:' . MK2_BG . ';"><span dir="ltr">' . esc_html( $code ) . '</span></td></tr></table>' : '' )
		. ( $small ? '<p style="margin:12px 0 0;' . MK2_BODY . 'font-size:13px;color:#C9B49A;">' . esc_html( $small ) . '</p>' : '' )
		. '</td></tr></table></td></tr>';
}

/** בלוק תחתון · עזרה: כרטיס חום, וואטסאפ */
function mk2_help( $order, $title = 'שאלה לפני שמזמינים?' ) {
	return '<tr><td class="mk2-pad" style="padding:40px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_INK . ';border-radius:24px;"><tr><td align="center" style="padding:34px 30px;text-align:center;">'
		. '<p style="margin:0;' . MK2_HEAD . 'font-size:30px;color:' . MK2_BG . ';">' . esc_html( $title ) . '</p>'
		. '<p style="margin:10px auto 0;max-width:420px;' . MK2_BODY . 'font-size:17px;line-height:1.55;color:#E9DDCB;">על הברכה, המידה או המשלוח - כותבים לנו בוואטסאפ, או עונים למייל הזה. עונים אנשים, לא בוט.</p>'
		. '<a href="' . esc_url( mikra_store_wa_url( $order ) ) . '" style="display:inline-block;margin-top:20px;background:' . MK2_BG . ';color:' . MK2_INK . ';' . MK2_BODY . 'font-size:16px;font-weight:700;text-decoration:none;padding:13px 34px;border-radius:10px;">לוואטסאפ <span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span></a>'
		. '</td></tr></table></td></tr>';
}

/** בלוק תחתון · אחריות: 30 יום ושנה */
function mk2_guarantee() {
	$cell = function ( $big, $small ) {
		return '<td class="mk2-col" width="50%" align="center" style="width:50%;padding:8px;text-align:center;">'
			. '<p style="margin:0;' . MK2_HEAD . 'font-size:44px;line-height:1.1;color:' . MK2_BG . ';">' . $big . '</p>'
			. '<p style="margin:4px 0 0;' . MK2_BODY . 'font-size:15px;color:#E9DDCB;">' . esc_html( $small ) . '</p></td>';
	};
	return '<tr><td class="mk2-pad" style="padding:40px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_INK . ';border-radius:24px;"><tr><td style="padding:30px 20px;">'
		. '<p style="margin:0 0 14px;' . MK2_HEAD . 'font-size:28px;color:' . MK2_BG . ';text-align:center;">קונים בלב שקט</p>'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
		. $cell( '<span dir="ltr">30</span> יום', 'לא מתאים? מחזירים' )
		. $cell( 'שנה', 'אחריות על התכשיט' )
		. '</tr></table></td></tr></table></td></tr>';
}

/** בלוק תחתון · אישור הרבנות (מקור: lib/rabbinate.ts באתר) */
function mk2_rabbinate() {
	return '<tr><td class="mk2-pad" style="padding:40px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:' . MK2_CARD . ';border:1.5px solid ' . MK2_LINE . ';border-radius:24px;"><tr><td align="center" style="padding:30px 30px;text-align:center;">'
		. '<p style="margin:0;' . MK2_HEAD . 'font-size:28px;color:' . MK2_INK . ';">באישור לשכת הרבנות</p>'
		. '<p style="margin:10px auto 0;max-width:430px;' . MK2_BODY . 'font-size:16px;line-height:1.55;color:' . MK2_INK2 . ';">רב העיר מודיעין-מכבים-רעות עבר על הכתובים שעל השבבים - הפסוקים והברכות - ואישר להוציא את התכשיטים.</p>'
		. '<a href="' . esc_url( MIKRA_SITE . '/rabbinate' ) . '" style="display:inline-block;margin-top:16px;' . MK2_BODY . 'font-size:15px;font-weight:700;color:' . MK2_INK . ';text-decoration:underline;">למכתב המלא</a>'
		. '</td></tr></table></td></tr>';
}

function mk2_footer( $unsub = '', $why = 'כי התחלת הזמנה באתר ואישרת דיוור', $service = '' ) {
	$u = '';
	if ( $unsub ) {
		$u = '<br>קיבלת את המייל ' . esc_html( $why ) . '. <a href="' . esc_url( $unsub ) . '" style="color:' . MK2_MUTED . ';text-decoration:underline;">להסרה מרשימת התפוצה</a>'
			. '<br>זהו דיוור ישיר של מִקְרָא. למחיקת הפרטים מהמאגר - עונים למייל הזה.';
	} elseif ( $service ) {
		$u = '<br>' . esc_html( $service );
	}
	return '<tr><td align="center" style="padding:30px 36px 40px;' . MK2_BODY . 'font-size:12px;line-height:1.7;color:' . MK2_MUTED . ';text-align:center;">'
		. 'מִקְרָא · תכשיטים עם ברכה חרוטה · גולדה מאיר 112, מודיעין<br>'
		. '<span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span> · ' . esc_html( MIKRA_EMAIL ) . ' · <a href="' . esc_url( MIKRA_SITE ) . '" style="color:' . MK2_MUTED . ';">mikra.shop</a>'
		. $u . '</td></tr>';
}
