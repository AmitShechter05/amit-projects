<?php
/**
 * סדרת ההצטרפות: חמישה מיילים למי שנרשם בפופאפ ועוד לא קנה.
 *
 * העיצוב נבנה בפיגמה (קובץ "מקרא - מיילים", 12.10.2026) והועבר לכאן
 * כבלוקים: פס עליון, תמונה, כותרת בניגוד משקלים, כרטיס קופון, עדשה,
 * תכשיטים, אינדקס ברכות, שורת אמון, חתימה ותחתית. כל מייל מורכב מהם.
 *
 * מתי נשלח:
 *   1 - דקה וחצי אחרי ההרשמה: ברוכים הבאים + הקוד
 *   2 - יום אחרי: ככה נראית ברכה על שבב (העדשה)
 *   3 - יום 3: למי המתנה - חמש הברכות, ותכשיט לכל אחת
 *   4 - יום 5: ככה זה נראה עליכם
 *   5 - יום לפני שהקוד פג, ורק אם הוא באמת פג (מהקופון בווקומרס)
 *
 * לפני כל מייל נבדק מחדש: עדיין הסכים, לא הוסר, ולא קנה. מי שקנה -
 * הסדרה נעצרת. בכל מייל: "פרסומת" בנושא, פרטי העסק וקישור הסרה
 * (חוק התקשורת, סעיף 30א), וכותרת List-Unsubscribe להסרה בלחיצה.
 */

defined( 'ABSPATH' ) || exit;

/** קוד הקופון של המבצע בווקומרס. ממנו נלקחים האחוז ותאריך הסיום */
define( 'MIKRA_PROMO_COUPON', 'mikra20' );
define( 'MIKRA_FROM', 'orders@mikra.shop' );
define( 'MIKRA_IMG', MIKRA_SITE . '/brand/email/' );
/**
 * ברכות שאין להן כרגע תכשיט (15.10.2026: ברכת התינוק - הסיכה הוסתרה, אין
 * מלאי). כמו HIDDEN_BLESSINGS באתר: לא מופיעות באף מייל. להחזיר = למחוק.
 */
define( 'MIKRA_HIDDEN_BLESSINGS', array( 'tinok' ) );

/** "חמש" / "ארבע" - כמה ברכות יש לבחירה */
function mikra_blessing_count() {
	$n     = 5 - count( MIKRA_HIDDEN_BLESSINGS );
	$words = array( 1 => 'אחת', 2 => 'שתיים', 3 => 'שלוש', 4 => 'ארבע', 5 => 'חמש' );
	return isset( $words[ $n ] ) ? $words[ $n ] : (string) $n;
}

/* ------------------------------------------------------------------
 * נתונים
 * ------------------------------------------------------------------ */

/** המבצע הפעיל, או null. נקרא מהקופון עצמו, כדי שלא יהיו שני מקורות */
function mikra_promo() {
	if ( ! class_exists( 'WC_Coupon' ) ) {
		return null;
	}
	$c = new WC_Coupon( MIKRA_PROMO_COUPON );
	if ( ! $c->get_id() || 'percent' !== $c->get_discount_type() ) {
		return null;
	}
	$exp = $c->get_date_expires();
	$ts  = $exp ? $exp->getTimestamp() : null;
	if ( $ts && $ts < time() ) {
		return null;
	}
	return array(
		'code'    => strtoupper( $c->get_code() ),
		'percent' => (int) round( (float) $c->get_amount() ),
		'expires' => $ts,
		'until'   => $ts ? wp_date( 'j.n', $ts ) : '',
	);
}

/** "₪359" לפי המחיר בווקומרס עכשיו */
function mikra_sku_price( $sku ) {
	$id = function_exists( 'wc_get_product_id_by_sku' ) ? wc_get_product_id_by_sku( $sku ) : 0;
	$p  = $id ? wc_get_product( $id ) : null;
	if ( ! $p || '' === $p->get_price() ) {
		return '';
	}
	$v = (float) $p->get_price();
	return '₪' . ( abs( $v - round( $v ) ) < 0.005 ? number_format( $v, 0 ) : number_format( $v, 2 ) );
}

function mikra_utm( $path, $campaign ) {
	$sep = false === strpos( $path, '?' ) ? '?' : '&';
	return MIKRA_SITE . $path . $sep . 'utm_source=email&utm_medium=series&utm_campaign=' . rawurlencode( $campaign );
}

/* ------------------------------------------------------------------
 * בלוקים. כל אחד מחזיר <tr> אחד או יותר בתוך טבלת ה-600
 * ------------------------------------------------------------------ */

const MIKRA_FONT = "font-family:Heebo,Arial,'Segoe UI',Tahoma,sans-serif;";

function mk_text( $text, $size, $weight, $color, $extra = '' ) {
	return '<p dir="rtl" style="margin:0;direction:rtl;' . MIKRA_FONT . 'font-size:' . $size . 'px;font-weight:' . $weight . ';color:' . $color . ';' . $extra . '">' . $text . '</p>';
}

function mk_row( $inner, $pad = '0 40px', $bg = '' ) {
	return '<tr><td class="mk-pad" align="right" style="padding:' . $pad . ';' . ( $bg ? 'background:' . $bg . ';' : '' ) . 'text-align:right;">' . $inner . '</td></tr>';
}

function mk_topbar( $label ) {
	return '<tr><td style="padding:26px 36px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
		. '<td align="right"><a href="' . esc_url( MIKRA_SITE ) . '"><img src="' . esc_url( MIKRA_SITE . '/brand/mikra-logo-email.png' ) . '" width="124" alt="מִקְרָא" style="display:block;width:124px;height:auto;border:0;"></a></td>'
		. '<td align="left" style="' . MIKRA_FONT . 'font-size:12px;font-weight:500;color:#6f6c62;text-align:left;">' . esc_html( $label ) . '</td>'
		. '</tr></table></td></tr>';
}

function mk_image( $file, $alt, $link = '' ) {
	$img = '<img src="' . esc_url( MIKRA_IMG . $file ) . '" width="600" alt="' . esc_attr( $alt ) . '" style="display:block;width:100%;height:auto;border:0;">';
	return '<tr><td>' . ( $link ? '<a href="' . esc_url( $link ) . '">' . $img . '</a>' : $img ) . '</td></tr>';
}

/** כותרת: שורה דקה ושורה עבה, כמו בכותרת של האתר */
function mk_heading( $kicker, $light, $bold, $body = '', $size = 50 ) {
	$h  = $kicker ? mk_text( esc_html( $kicker ), 13, 700, '#96661c', 'margin-bottom:14px;' ) : '';
	$h .= mk_text( esc_html( $light ), $size, 200, '#16150f', 'line-height:1.05;' );
	$h .= mk_text( esc_html( $bold ), $size, 800, '#16150f', 'line-height:1.05;' );
	if ( $body ) {
		$h .= mk_text( $body, 16, 300, '#4a4840', 'line-height:1.75;margin-top:18px;' );
	}
	return '<tr><td class="mk-pad" align="right" style="padding:44px 44px 10px;text-align:right;"><div class="mk-h">' . $h . '</div></td></tr>';
}

function mk_para( $html, $pad = '30px 40px 0' ) {
	return mk_row( mk_text( $html, 17, 300, '#16150f', 'line-height:1.7;' ), $pad );
}

/**
 * כרטיס הקופון: אחוז ענק דק, ניקוב, והקוד. $small מחליף את שורת
 * "מקלידים בקופה" ו-$scope את "על כל האתר" (למשל קוד שנכנס להזמנה
 * בלחיצה על הכפתור)
 */
function mk_ticket( $promo, $lead = 'הקוד שלך', $small = null, $scope = 'על כל האתר' ) {
	if ( ! $promo ) {
		return '';
	}
	if ( null === $small ) {
		$small = $promo['until'] ? 'מקלידים בקופה · בתוקף עד ' . $promo['until'] : 'מקלידים בקופה';
	}
	return '<tr><td class="mk-pad" style="padding:28px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#f3ead8;"><tr>'
		. '<td align="right" style="padding:28px 30px 28px 18px;text-align:right;">'
		. mk_text( esc_html( $lead ), 14, 300, '#4a4840' )
		. mk_text( '<span dir="ltr">' . esc_html( $promo['code'] ) . '</span>', 32, 800, '#16150f', 'letter-spacing:2px;line-height:1.2;margin:4px 0;' )
		. mk_text( esc_html( $small ), 12, 400, '#6f6c62' )
		. '</td><td width="1" style="border-right:2px dashed #d9c7a3;font-size:0;">&nbsp;</td>'
		. '<td align="center" width="150" style="padding:24px 18px;text-align:center;">'
		. mk_text( '<span dir="ltr">' . (int) $promo['percent'] . '%</span>', 58, 200, '#96661c', 'line-height:1;text-align:center;' )
		. mk_text( esc_html( $scope ), 12, 500, '#4a4840', 'text-align:center;margin-top:6px;' )
		. '</td></tr></table></td></tr>';
}

function mk_button( $label, $url, $pad = '28px 40px 0' ) {
	return '<tr><td align="center" style="padding:' . $pad . ';"><a href="' . esc_url( $url ) . '" style="display:inline-block;background:#16150f;color:#fbf8f1;' . MIKRA_FONT . 'font-size:16px;font-weight:500;text-decoration:none;padding:17px 52px;">' . esc_html( $label ) . '</a></td></tr>';
}

/** עדשה קטנה עם הצילום מהמיקרוסקופ, ליד טקסט */
function mk_lens_block( $kicker, $title, $body ) {
	return '<tr><td class="mk-pad" style="padding:52px 40px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
		. '<td class="mk-col" align="right" style="vertical-align:middle;text-align:right;padding-left:26px;">'
		. mk_text( esc_html( $kicker ), 12, 700, '#96661c', 'margin-bottom:10px;' )
		. mk_text( $title, 28, 800, '#16150f', 'line-height:1.18;' )
		. mk_text( esc_html( $body ), 14, 300, '#4a4840', 'line-height:1.7;margin-top:10px;' )
		. '</td><td class="mk-col" width="176" align="center" style="vertical-align:middle;">'
		. '<img src="' . esc_url( MIKRA_IMG . 'lens-ring.png' ) . '" width="176" height="176" alt="השבב במיקרוסקופ" style="display:block;width:176px;height:176px;border:0;">'
		. '</td></tr></table></td></tr>';
}

/**
 * תכשיטים בעמודות. $items: [slug, sku, name, sub, image]
 */
function mk_products( $title, $items, $campaign, $center = true ) {
	$cols = '';
	$w    = (int) floor( 100 / count( $items ) );
	foreach ( $items as $it ) {
		list( $slug, $sku, $name, $sub, $img ) = $it;
		$price = mikra_sku_price( $sku );
		$cols .= '<td class="mk-pcol" width="' . $w . '%" align="center" style="vertical-align:top;padding:0 7px;text-align:center;">'
			. '<a href="' . esc_url( mikra_utm( '/products/' . $slug, $campaign ) ) . '" style="text-decoration:none;color:#16150f;">'
			. '<img src="' . esc_url( MIKRA_IMG . $img ) . '" width="170" alt="' . esc_attr( $name ) . '" style="display:block;width:100%;height:auto;border:0;">'
			. mk_text( esc_html( $name ), 16, 800, '#16150f', 'text-align:center;margin-top:12px;' )
			. mk_text( esc_html( $sub ), 12, 300, '#4a4840', 'text-align:center;margin-top:2px;' )
			. ( $price ? mk_text( esc_html( $price ), 14, 500, '#16150f', 'text-align:center;margin-top:4px;' ) : '' )
			. '</a></td>';
	}
	return '<tr><td class="mk-pad" style="padding:46px 30px 0;">'
		. mk_text( esc_html( $title ), 22, 800, '#16150f', 'text-align:' . ( $center ? 'center' : 'right' ) . ';margin-bottom:20px;' )
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>' . $cols . '</tr></table></td></tr>';
}

/** אינדקס הברכות, ליד תמונה גבוהה של השרשראות */
function mk_blessing_index( $campaign ) {
	$list = array(
		array( 'אשת חיל', 'לאמא, לאישה, לסבתא', 'eshet-chayil' ),
		array( 'ברכת התינוק', 'לתינוק שנולד', 'tinok' ),
		array( 'שמירה והגנה', 'למי שיוצא לדרך', 'shmira' ),
		array( 'ברכת הפרנסה', 'למי שבונה משהו', 'parnasa' ),
		array( 'הברכה שלך', 'לכל רגע של התחלה', 'bracha' ),
	);
	$list = array_values( array_filter( $list, function ( $b ) {
		return ! in_array( $b[2], MIKRA_HIDDEN_BLESSINGS, true );
	} ) );
	$rows = '';
	foreach ( $list as $i => $b ) {
		$rows .= '<tr><td style="padding:14px 0;border-bottom:1px solid #d9c7a3;' . ( 0 === $i ? 'border-top:1px solid #d9c7a3;' : '' ) . '">'
			. '<a href="' . esc_url( mikra_utm( '/blessings/' . $b[2], $campaign ) ) . '" style="text-decoration:none;display:block;">'
			. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="right" style="text-align:right;">'
			. mk_text( esc_html( $b[0] ), 24, 300, '#16150f', 'line-height:1.2;' )
			. mk_text( esc_html( $b[1] ), 12, 500, '#96661c', 'margin-top:2px;' )
			. '</td><td align="left" width="24" style="' . MIKRA_FONT . 'font-size:16px;color:#96661c;text-align:left;">←</td></tr></table></a></td></tr>';
	}
	return '<tr><td class="mk-pad" style="padding:56px 36px 0;">'
		. mk_text( mikra_blessing_count() . ' ברכות לבחירה', 12, 700, '#96661c' )
		. mk_text( 'לכל רגע, ברכה משלו', 30, 800, '#16150f', 'line-height:1.2;margin:6px 0 26px;' )
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
		. '<td class="mk-col" align="right" style="vertical-align:top;">'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">' . $rows . '</table></td>'
		. '<td class="mk-col mk-hide" width="196" style="vertical-align:top;padding-right:26px;"><img src="' . esc_url( MIKRA_IMG . 'tall-trio.jpg' ) . '" width="196" alt="שרשראות של מקרא" style="display:block;width:196px;height:auto;border:0;"></td>'
		. '</tr></table></td></tr>';
}

function mk_trust() {
	$items = array( array( 'חריטה', 'לפי ההזמנה שלך' ), array( 'משלוח מבוטח', '2-4 ימי עסקים' ), array( 'החזרה', 'תוך 30 יום' ) );
	$c     = '';
	foreach ( $items as $i => $it ) {
		$c .= '<td width="33%" align="center" style="text-align:center;padding:4px 6px;' . ( 1 === $i ? 'border-left:1px solid #e6d9bf;border-right:1px solid #e6d9bf;' : '' ) . '">'
			. mk_text( esc_html( $it[0] ), 15, 800, '#16150f', 'text-align:center;' )
			. mk_text( esc_html( $it[1] ), 13, 300, '#4a4840', 'text-align:center;margin-top:4px;' ) . '</td>';
	}
	return '<tr><td class="mk-pad" style="padding:46px 30px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>' . $c . '</tr></table></td></tr>';
}

/** שלושה שלבים בעיגולים, עם אות זהב בתג שחור */
function mk_steps() {
	$s = array(
		array( 'א', 'בוחרים', 'תכשיט, ואחת מ' . mikra_blessing_count() . ' ברכות. אפשר לקרוא כל ברכה לפני שקונים.', 'step-choose-c.png' ),
		array( 'ב', 'חורטים ובודקים', 'את השבב חורטים לפי ההזמנה, ובודקים מול הטקסט המקורי.', 'step-engrave-c.png' ),
		array( 'ג', 'אורזים ושולחים', 'בקופסה מרופדת, עם כרטיס הברכה. מגיע תוך 2-4 ימי עסקים.', 'step-pack-c.png' ),
	);
	$c = '';
	foreach ( $s as $it ) {
		$c .= '<td class="mk-pcol" width="33%" align="center" style="vertical-align:top;text-align:center;padding:0 7px;">'
			. '<img src="' . esc_url( MIKRA_IMG . $it[3] ) . '" width="126" height="126" alt="" style="display:block;margin:0 auto;width:126px;height:126px;border:0;">'
			. mk_text( esc_html( $it[1] ), 17, 800, '#16150f', 'text-align:center;margin-top:12px;' )
			. mk_text( esc_html( $it[2] ), 13, 300, '#4a4840', 'text-align:center;line-height:1.65;margin-top:6px;' ) . '</td>';
	}
	return '<tr><td class="mk-pad" style="padding:46px 30px 46px;">'
		. mk_text( 'מהבחירה ועד הקופסה', 22, 800, '#16150f', 'text-align:center;margin-bottom:26px;' )
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>' . $c . '</tr></table></td></tr>';
}

/**
 * רצועת פסוק על צילום כהה (שרשרת על שיש שחור, מוחשכת מראש בקובץ).
 * באאוטלוק, שלא מציג רקע, נשאר הצבע הכהה והטקסט קריא
 */
function mk_quote_band( $kicker, $verse, $source ) {
	$bg = esc_url( MIKRA_IMG . 'quote-bg.jpg' );
	return '<tr><td background="' . $bg . '" bgcolor="#1d1a16" align="center" style="background:#1d1a16 url(' . $bg . ') center/cover no-repeat;padding:96px 50px 70px;text-align:center;">'
		. mk_text( esc_html( $kicker ), 12, 700, '#c9a35a', 'text-align:center;' )
		. mk_text( $verse, 34, 200, '#fbf8f1', 'text-align:center;line-height:1.4;margin-top:16px;' )
		. '<div style="width:40px;height:1px;line-height:1px;background:#c9a35a;margin:20px auto 14px;">&nbsp;</div>'
		. mk_text( esc_html( $source ), 12, 400, '#b9b3a3', 'text-align:center;' ) . '</td></tr>';
}

function mk_signoff( $text ) {
	return '<tr><td class="mk-pad" align="right" style="padding:46px 44px 0;text-align:right;">'
		. mk_text( $text, 15, 300, '#4a4840', 'line-height:1.7;' )
		. mk_text( 'צוות מִקְרָא', 15, 500, '#16150f', 'margin-top:8px;' ) . '</td></tr>';
}

/**
 * תחתית: פרטי העסק, ובמייל שיווקי - למה קיבלת והסרה. מייל שירות (בלי
 * הסכמה לדיוור) מקבל במקום זה שורה שמסבירה על איזו הזמנה מדובר
 */
function mk_footer( $unsub = '', $why = 'כי נרשמת באתר', $service = '' ) {
	$u = '';
	if ( $unsub ) {
		$u = '<br>קיבלת את המייל ' . esc_html( $why ) . '. <a href="' . esc_url( $unsub ) . '" style="color:#6f6c62;text-decoration:underline;">להסרה מרשימת התפוצה</a>'
			. '<br>זהו דיוור ישיר של מִקְרָא. למחיקת הפרטים מהמאגר - עונים למייל הזה.';
	} elseif ( $service ) {
		$u = '<br>' . esc_html( $service );
	}
	return '<tr><td align="center" style="padding:40px 30px 36px;' . MIKRA_FONT . 'font-size:11px;line-height:1.8;color:#6f6c62;text-align:center;">'
		. 'מִקְרָא · תכשיטים עם ברכה חרוטה · גולדה מאיר 112, מודיעין<br>'
		. '<a href="' . esc_url( MIKRA_SITE ) . '" style="color:#96661c;text-decoration:none;">mikra.shop</a> · <span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span> · ' . esc_html( MIKRA_EMAIL )
		. $u . '</td></tr>';
}

/** המעטפת: html, טבלת 600 ושורות */
function mk_wrap( $title, $preheader, $rows ) {
	return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
		. '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' . esc_html( $title ) . '</title>'
		. '<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@200;300;500;700;800&display=swap" rel="stylesheet"><!--<![endif]-->'
		. '<!--[if mso]><style>*{font-family:Arial,sans-serif!important}</style><![endif]-->'
		. '<style>body{margin:0;padding:0;background:#fbf8f1}a{text-decoration:none}'
		. '@media (max-width:620px){.mk-wrap{width:100%!important}.mk-pad{padding-left:20px!important;padding-right:20px!important}'
		. '.mk-col{display:block!important;width:100%!important;padding:0 0 18px!important}.mk-hide{display:none!important}'
		. '.mk-h p{font-size:38px!important}.mk-pcol{padding:0 3px!important}.mk-hero{height:560px!important}.mk-hero p.mk-ht{font-size:32px!important}}</style></head>'
		. '<body dir="rtl" style="margin:0;padding:0;background:#fbf8f1;">'
		. '<div style="display:none;max-height:0;overflow:hidden;">' . esc_html( $preheader ) . '</div>'
		. '<div dir="rtl" lang="he" style="direction:rtl;">'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fbf8f1;"><tr><td align="center">'
		. '<table role="presentation" class="mk-wrap" width="600" cellpadding="0" cellspacing="0" dir="rtl" lang="he" style="width:600px;max-width:600px;background:#fbf8f1;direction:rtl;' . MIKRA_FONT . 'color:#16150f;">'
		. $rows . '</table></td></tr></table></div></body></html>';
}

/* ------------------------------------------------------------------
 * חמשת המיילים. כל אחד מחזיר [נושא, html]
 * ------------------------------------------------------------------ */

function mikra_series_email( $step, $first_name, $unsub ) {
	$p    = mikra_promo();
	$hi   = $first_name ? 'שלום ' . esc_html( $first_name ) . ', ' : 'שלום, ';
	$camp = 'welcome-' . $step;

	switch ( (int) $step ) {
		case 1:
			$rows = mk_topbar( 'ברוכים הבאים · מכתב 1' )
				. mk_image( 'hero1.jpg', 'ברוכים הבאים למִקְרָא', mikra_utm( '/', $camp ) )
				. ( $p ? mk_para( $hi . 'הבטחנו לך מתנת היכרות. הנה היא:', '34px 40px 0' ) . mk_ticket( $p, 'מתנת ההיכרות שלך' ) : mk_para( $hi . 'שמחים שהצטרפת.', '34px 40px 0' ) )
				. mk_button( 'לכל התכשיטים', mikra_utm( '/catalog', $camp ) )
				. mk_lens_block( 'מה זה מִקְרָא', 'ברכה שלמה,<br>על שבב של <span dir="ltr">5</span> מ״מ.', 'בכל תכשיט יש שבב קטן, ועליו חרוטה ברכה שלמה, אות אחרי אות. בוחרים תכשיט, בוחרים ברכה, ואנחנו חורטים, בודקים ואורזים.' )
				. mk_products( 'ככה זה נראה עליכם', array(
					array( 'tipat-or', 'YASNN010W', 'טִפַּת אוֹר', 'שרשרת Y, כסף 925', 'tipat-or.jpg' ),
					array( 'beseter-gold', 'OYANN003G', 'בְּסֵתֶר', 'מגן דוד, מוזהב', 'beseter-gold.jpg' ),
					array( 'libi-er-gold', 'OYANB002G', 'לִבִּי עֵר', 'צמיד, מוזהב', 'libi-er-gold.jpg' ),
				), $camp )
				. mk_blessing_index( $camp )
				. mk_trust()
				. mk_signoff( 'מתלבטים איזו ברכה לבחור? פשוט עונים למייל הזה וכותבים למי המתנה. נעזור.' );
			$subject = $p ? 'פרסומת: ברוכים הבאים למִקְרָא · מתנת היכרות בפנים' : 'פרסומת: ברוכים הבאים למִקְרָא';
			$pre     = $p ? 'הקוד שלך ל-' . $p['percent'] . '% הנחה על כל האתר.' : 'ברכה שלמה, על שבב של 5 מ״מ.';
			break;

		case 2:
			$rows = mk_topbar( 'איך זה נעשה · מכתב 3' )
				. mk_image( 'hero2.jpg', 'שרשרת של מקרא, ועדשה שמראה את הברכה על השבב במיקרוסקופ' )
				. mk_heading( 'מה שרואים בעדשה', 'זו הברכה.', 'על שבב של 5 מ״מ.', 'בתוך העדשה: צילום אמיתי של השבב של "אשת חיל", במיקרוסקופ. כל אות שם בגובה של כמחצית מעובי שערה, ועדיין אפשר לקרוא כל מילה.', 54 )
				. mk_steps()
				. mk_quote_band( 'מה שחרוט על השבב', 'אֵשֶׁת חַיִל מִי יִמְצָא,<br>וְרָחֹק מִפְּנִינִים מִכְרָהּ', 'הפסוק הראשון · משלי ל״א, י׳' )
				. mk_products( 'אולי זה בשבילך', array(
					array( 'beseter-gold', 'OYANN003G', 'בְּסֵתֶר', 'מגן דוד לגבר, מוזהב', 'beseter-gold.jpg' ),
					array( 'libi-er-gold', 'OYANB002G', 'לִבִּי עֵר', 'צמיד עם לב, מוזהב', 'libi-er-gold.jpg' ),
				), $camp, false )
				. mk_ticket( $p, 'הקוד שלך עדיין מחכה' )
				. mk_button( 'לבחירת תכשיט', mikra_utm( '/catalog', $camp ) )
				. mk_signoff( 'יש שאלה על הברכה או על התכשיט? פשוט עונים למייל הזה.' );
			$subject = 'פרסומת: ככה נראית ברכה על שבב של 5 מ״מ';
			$pre     = 'צילום אמיתי של השבב במיקרוסקופ.';
			break;

		case 3:
			$rows = mk_topbar( 'למי המתנה · מכתב 2' )
				. mk_heading( mikra_blessing_count() . ' ברכות, ולכל אחת רגע משלה', 'למי', 'המתנה?', $hi . 'כל ברכה נכתבה לרגע אחר בחיים. ככה בוחרים: מתחילים ממי שמקבל.', 56 )
				. mk_blessing_rows( array( 'eshet-chayil', 'tinok', 'shmira', 'parnasa', 'bracha' ), $camp );
			$rows .= mk_ticket( $p ) . mk_button( 'לכל התכשיטים', mikra_utm( '/catalog', $camp ) )
				. mk_signoff( 'עדיין לא בטוחים? עונים למייל הזה וכותבים למי המתנה ולאיזה רגע. נציע ברכה ותכשיט.' );
			$subject = 'פרסומת: למי המתנה? ככה בוחרים ברכה';
			$pre     = mikra_blessing_count() . ' ברכות, ולכל אחת רגע משלה - ותכשיט לכל אחת.';
			break;

		case 4:
			$rows = mk_topbar( 'ככה זה נראה · מכתב 4' )
				. mk_image( 'm4-hero.jpg', 'זוג עונד צמידים של מקרא' )
				. mk_heading( 'קטן מספיק ליום-יום', 'ככה זה נראה', 'עליכם.', $hi . 'שבב של 5 מ״מ לא מושך תשומת לב. מי שעונד יודע מה כתוב עליו, וזה מספיק.', 50 )
				. mk_gallery4( $camp )
				. '<tr><td align="center" style="padding:30px 40px 0;"><table role="presentation" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
				. '<td style="padding:0 6px;"><a href="' . esc_url( mikra_utm( '/catalog?for=women', $camp ) ) . '" style="display:inline-block;border:1px solid #16150f;color:#16150f;' . MIKRA_FONT . 'font-size:15px;font-weight:500;text-decoration:none;padding:14px 34px;">לאישה</a></td>'
				. '<td style="padding:0 6px;"><a href="' . esc_url( mikra_utm( '/catalog?for=men', $camp ) ) . '" style="display:inline-block;border:1px solid #16150f;color:#16150f;' . MIKRA_FONT . 'font-size:15px;font-weight:500;text-decoration:none;padding:14px 34px;">לגבר</a></td>'
				. '</tr></table></td></tr>'
				. mk_ticket( $p, 'הקוד שלך עדיין בתוקף' )
				. mk_trust()
				. mk_signoff( 'יש שאלה על תכשיט מסוים? עונים למייל הזה, ונענה על כל שאלה.' );
			$subject = 'פרסומת: ככה זה נראה עליכם';
			$pre     = 'שבב של 5 מ״מ, ליום-יום.';
			break;

		case 5:
			if ( ! $p || ! $p['expires'] ) {
				return null;
			}
			$rows = mk_topbar( 'תזכורת · מכתב 5' )
				. mk_heading( 'ההנחה שלך', 'בתוקף עד', 'מחר בחצות.', $hi . 'רק כדי שלא יפתיע: הקוד שקיבלת כשנרשמת מסתיים מחר, ' . esc_html( $p['until'] ) . ', בסוף היום.', 54 )
				. mk_ticket( $p )
				. mk_button( 'לבחירת תכשיט', mikra_utm( '/catalog', $camp ) )
				. mk_products( 'הכי נבחרים עכשיו', array(
					array( 'tipat-or', 'YASNN010W', 'טִפַּת אוֹר', 'שרשרת Y, כסף 925', 'tipat-or.jpg' ),
					array( 'beseter-gold', 'OYANN003G', 'בְּסֵתֶר', 'מגן דוד, מוזהב', 'beseter-gold.jpg' ),
					array( 'libi-er-gold', 'OYANB002G', 'לִבִּי עֵר', 'צמיד, מוזהב', 'libi-er-gold.jpg' ),
				), $camp )
				. mk_signoff( 'יש שאלה לפני שמזמינים? עונים למייל הזה.' );
			$subject = 'פרסומת: ההנחה שלך מסתיימת מחר';
			$pre     = 'הקוד ' . $p['code'] . ' בתוקף עד ' . $p['until'] . '.';
			break;

		default:
			return null;
	}

	return array( $subject, mk_wrap( $subject, $pre, $rows . mk_footer( $unsub ) ) );
}

function mk4_cell( $slug, $sku, $name, $img, $camp ) {
	$price = mikra_sku_price( $sku );
	return '<td width="50%" class="mk-pcol" style="vertical-align:top;padding:0 7px 18px;"><a href="' . esc_url( mikra_utm( '/products/' . $slug, $camp ) ) . '" style="text-decoration:none;color:#16150f;">'
		. '<img src="' . esc_url( MIKRA_IMG . $img ) . '" width="263" alt="' . esc_attr( $name ) . '" style="display:block;width:100%;height:auto;border:0;">'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin-top:10px;"><tr>'
		. '<td align="right" style="text-align:right;">' . mk_text( esc_html( $name ), 16, 800, '#16150f' ) . '</td>'
		. '<td align="left" style="text-align:left;">' . mk_text( esc_html( $price ), 14, 500, '#16150f', 'text-align:left;' ) . '</td>'
		. '</tr></table></a></td>';
}

/** ארבע תמונות על הגוף, שתיים בשורה (מכתב 4 של ההצטרפות, וההטבה בזרימת החזרה) */
function mk_gallery4( $camp ) {
	return '<tr><td class="mk-pad" style="padding:34px 30px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">'
		. '<tr>' . mk4_cell( 'tipat-or', 'YASNN010W', 'טִפַּת אוֹר', 'm4-tipat.jpg', $camp ) . mk4_cell( 'beseter', 'OYANN003S', 'בְּסֵתֶר', 'm4-beseter.jpg', $camp ) . '</tr>'
		. '<tr>' . mk4_cell( 'ahavat-olam', 'YASNB001W', 'אַהֲבַת עוֹלָם', 'm4-ahavat.jpg', $camp ) . mk4_cell( 'avot-black', 'OYANB007B', 'עֲבוֹת', 'm4-avot-black.jpg', $camp ) . '</tr>'
		. '</table></td></tr>';
}

/** הברכות שמופיעות בשורות "למי המתנה": למי, שם, פסוק, תכשיט לדוגמה */
function mikra_blessing_picks() {
	$all = array(
		'eshet-chayil' => array( 'לאמא, לאישה, לסבתא', 'אשת חיל', 'אֵשֶׁת חַיִל מִי יִמְצָא,<br>וְרָחֹק מִפְּנִינִים מִכְרָהּ', 'kachotam', 'OYANN001G', 'כַּחוֹתָם', 'm3-kachotam.jpg' ),
		'tinok'        => array( 'לתינוק שנולד', 'ברכת התינוק', 'יְבָרֶכְךָ ה׳<br>וְיִשְׁמְרֶךָ', 'tzel-knafayim', 'BABYPIN01', 'צֵל כְּנָפַיִם', 'm3-tzel.jpg' ),
		'shmira'       => array( 'למי שיוצא לדרך', 'שמירה והגנה', 'יֹשֵׁב בְּסֵתֶר עֶלְיוֹן,<br>בְּצֵל שַׁדַּי יִתְלוֹנָן', 'beseter', 'OYANN003S', 'בְּסֵתֶר', 'm3-beseter.jpg' ),
		'parnasa'      => array( 'למי שבונה משהו', 'ברכת הפרנסה', 'לַה׳ הָאָרֶץ וּמְלוֹאָהּ,<br>תֵּבֵל וְיֹשְׁבֵי בָהּ', 'avot', 'OYANB007RS', 'עֲבוֹת', 'm3-avot.jpg' ),
		'bracha'       => array( 'לכל רגע של התחלה', 'הברכה שלך', 'וּבָאוּ עָלֶיךָ כָּל הַבְּרָכוֹת<br>הָאֵלֶּה וְהִשִּׂיגֻךָ', 'toldot', 'YASNN004W', 'תּוֹלְדוֹת', 'm3-toldot.jpg' ),
	);
	return array_diff_key( $all, array_flip( MIKRA_HIDDEN_BLESSINGS ) );
}

/** שורות לבנות של תמונה וברכה, מתחלפות צד */
function mk_blessing_rows( $ids, $camp ) {
	$all  = mikra_blessing_picks();
	$rows = '';
	$i    = 0;
	foreach ( $ids as $id ) {
		if ( empty( $all[ $id ] ) ) {
			continue;
		}
		list( $who, $name, $verse, $pslug, $sku, $pname, $img ) = $all[ $id ];
		$price  = mikra_sku_price( $sku );
		$img_td = '<td class="mk-col" width="250" style="vertical-align:middle;"><a href="' . esc_url( mikra_utm( '/products/' . $pslug, $camp ) ) . '"><img src="' . esc_url( MIKRA_IMG . $img ) . '" width="250" alt="' . esc_attr( $pname ) . '" style="display:block;width:100%;height:auto;border:0;"></a></td>';
		$txt_td = '<td class="mk-col" align="right" style="vertical-align:middle;text-align:right;padding:0 28px;">'
			. mk_text( esc_html( $who ), 12, 700, '#96661c' )
			. mk_text( esc_html( $name ), 30, 200, '#16150f', 'line-height:1.15;margin-top:6px;' )
			. mk_text( $verse, 14, 300, '#4a4840', 'line-height:1.6;margin-top:10px;' )
			. mk_text( esc_html( $pname ) . ( $price ? ' · ' . esc_html( $price ) : '' ), 14, 800, '#16150f', 'margin-top:14px;' )
			. '<p style="margin:8px 0 0;' . MIKRA_FONT . 'font-size:13px;font-weight:500;"><a href="' . esc_url( mikra_utm( '/blessings/' . $id, $camp ) ) . '" style="color:#96661c;text-decoration:underline;">לקריאת הברכה</a> &nbsp;·&nbsp; <a href="' . esc_url( mikra_utm( '/products/' . $pslug, $camp ) ) . '" style="color:#96661c;text-decoration:underline;">לתכשיט</a></p>'
			. '</td>';
		// מתחלף צד: dir="ltr" הופך את סדר העמודות בלי לשנות את הטקסט
		$rows .= '<tr><td style="padding:' . ( 0 === $i ? '36px' : '18px' ) . ' 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="' . ( 0 === $i % 2 ? 'rtl' : 'ltr' ) . '" style="background:#ffffff;"><tr>' . $img_td . $txt_td . '</tr></table></td></tr>';
		$i++;
	}
	return $rows;
}

/**
 * פתיחה: צילום על הגוף עם הטקסט עליו. בקובץ התמונה כבר צרובים ההצללה
 * והלוגו (נאפו מהפריים בפיגמה), והטקסט עצמו חי - כדי שיהיה קריא,
 * נגיש ומתורגם. באאוטלוק, שלא מציג רקע, נשאר צבע כהה והטקסט עליו
 */
function mk_photo_hero( $file, $kicker, $title_html, $sub, $cta = '', $url = '' ) {
	$bg = esc_url( MIKRA_IMG . $file );
	$in = ( $kicker ? mk_text( esc_html( $kicker ), 13, 700, '#c9a35a', 'text-align:center;margin-bottom:10px;' ) : '' )
		. '<p class="mk-ht" style="margin:0;' . MIKRA_FONT . 'font-size:40px;font-weight:800;line-height:1.15;color:#fbf8f1;text-align:center;">' . $title_html . '</p>'
		. ( $sub ? mk_text( esc_html( $sub ), 16, 300, '#e8e2d4', 'text-align:center;line-height:1.6;margin-top:12px;' ) : '' )
		. ( $cta ? '<p style="margin:24px 0 0;text-align:center;"><a href="' . esc_url( $url ) . '" style="display:inline-block;background:#c9a35a;color:#16150f;' . MIKRA_FONT . 'font-size:16px;font-weight:700;text-decoration:none;padding:16px 46px;">' . esc_html( $cta ) . '</a></p>' : '' );
	return '<tr><td class="mk-hero" background="' . $bg . '" bgcolor="#1d1a16" height="680" valign="bottom" align="center" style="background:#1d1a16 url(' . $bg . ') center top/cover no-repeat;height:680px;vertical-align:bottom;padding:0 44px 40px;text-align:center;">' . $in . '</td></tr>';
}

/** מה שבהזמנה: תמונה, שם, ברכה ומחיר, ובסוף הסכום */
function mk_cart( $order, $kicker = 'מה שחיכה לך בעגלה' ) {
	$items = '';
	foreach ( $order->get_items() as $item ) {
		$img      = mikra_store_item_image( $item );
		$blessing = (string) $item->get_meta( 'הברכה', true );
		$qty      = (int) $item->get_quantity();
		$items   .= '<tr><td style="padding:0 0 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#ffffff;"><tr>'
			. '<td width="170" style="vertical-align:middle;">' . ( $img ? '<img src="' . esc_url( $img ) . '" width="170" alt="" style="display:block;width:170px;height:auto;border:0;">' : '' ) . '</td>'
			. '<td align="right" style="vertical-align:middle;text-align:right;padding:18px 26px;">'
			. mk_text( esc_html( $item->get_name() ) . ( $qty > 1 ? ' <span style="font-weight:300;color:#6f6c62;">× ' . $qty . '</span>' : '' ), 20, 800, '#16150f', 'line-height:1.2;' )
			. ( '' !== $blessing ? mk_text( 'ברכה: ' . esc_html( $blessing ), 13, 300, '#4a4840', 'margin-top:6px;' ) : '' )
			. mk_text( wp_kses_post( mikra_store_money( $item->get_subtotal(), $order ) ), 15, 500, '#16150f', 'margin-top:10px;' )
			. '</td></tr></table></td></tr>';
	}
	return '<tr><td class="mk-pad" style="padding:36px 36px 0;">'
		. mk_text( esc_html( $kicker ), 12, 700, '#96661c', 'margin-bottom:14px;' )
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">' . $items . '</table>'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="border-top:1px solid #d9c7a3;margin-top:4px;"><tr>'
		. '<td align="right" style="padding-top:14px;text-align:right;">' . mk_text( 'סה״כ, כולל משלוח', 14, 300, '#4a4840' ) . '</td>'
		. '<td align="left" style="padding-top:14px;text-align:left;">' . mk_text( wp_kses_post( mikra_store_money( $order->get_total(), $order ) ), 24, 800, '#16150f', 'text-align:left;' ) . '</td>'
		. '</tr></table></td></tr>';
}

/** קופסה בהירה עם כותרת קצרה ושורה (שאלה לפני שמזמינים, "אם משהו לא בסדר") */
function mk_note( $title, $body_html, $pad = '34px 36px 0' ) {
	return '<tr><td class="mk-pad" style="padding:' . $pad . ';"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#f3ead8;"><tr>'
		. '<td align="right" style="padding:22px 26px;text-align:right;">'
		. mk_text( esc_html( $title ), 17, 800, '#16150f' )
		. mk_text( $body_html, 15, 300, '#4a4840', 'line-height:1.65;margin-top:6px;' )
		. '</td></tr></table></td></tr>';
}

/** ארבעה כללי שמירה, שניים בשורה, עם אות זהב */
function mk_care() {
	$r = array(
		array( 'א', 'מורידים לפני מים', 'מקלחת, ים ובריכה. עדיף בלי התכשיט.' ),
		array( 'ב', 'קודם בושם, אחר כך תכשיט', 'מתבשמים ומתמרחים, ורק אז עונדים.' ),
		array( 'ג', 'שומרים בקופסה', 'בנפרד משאר התכשיטים, כדי שלא יישרט.' ),
		array( 'ד', 'מנגבים בעדינות', 'במטלית רכה ויבשה. בלי חומרי ניקוי.' ),
	);
	$cell = function ( $it ) {
		return '<td class="mk-col" width="50%" style="vertical-align:top;padding:6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#ffffff;"><tr><td align="right" style="padding:22px 22px 24px;text-align:right;">'
			. mk_text( esc_html( $it[0] ), 44, 200, '#96661c', 'line-height:1;' )
			. mk_text( esc_html( $it[1] ), 18, 800, '#16150f', 'line-height:1.3;margin-top:10px;' )
			. mk_text( esc_html( $it[2] ), 14, 300, '#4a4840', 'line-height:1.6;margin-top:6px;' )
			. '</td></tr></table></td>';
	};
	return '<tr><td class="mk-pad" style="padding:10px 24px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">'
		. '<tr>' . $cell( $r[0] ) . $cell( $r[1] ) . '</tr><tr>' . $cell( $r[2] ) . $cell( $r[3] ) . '</tr></table></td></tr>';
}

/** שורה לבנה של תמונה וטקסט - כמו בשורות הברכות, לתוכן חופשי */
function mk_feature_row( $img, $kicker, $title, $body, $link_label = '', $link = '' ) {
	return '<tr><td style="padding:40px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#ffffff;"><tr>'
		. '<td class="mk-col" align="right" style="vertical-align:middle;text-align:right;padding:0 28px;">'
		. mk_text( esc_html( $kicker ), 12, 700, '#96661c' )
		. mk_text( esc_html( $title ), 30, 200, '#16150f', 'line-height:1.15;margin-top:6px;' )
		. mk_text( esc_html( $body ), 14, 300, '#4a4840', 'line-height:1.6;margin-top:10px;' )
		. ( $link ? '<p style="margin:12px 0 0;' . MIKRA_FONT . 'font-size:13px;font-weight:500;"><a href="' . esc_url( $link ) . '" style="color:#96661c;text-decoration:underline;">' . esc_html( $link_label ) . '</a></p>' : '' )
		. '</td><td class="mk-col" width="250" style="vertical-align:middle;"><img src="' . esc_url( MIKRA_IMG . $img ) . '" width="250" alt="" style="display:block;width:100%;height:auto;border:0;"></td>'
		. '</tr></table></td></tr>';
}

/** חמש קוביות דירוג. כל אחת קישור משלה (5 בשמאל, 1 בימין) */
function mk_rating( $url_for ) {
	$c = '';
	foreach ( array( 5, 4, 3, 2, 1 ) as $n ) {
		$c .= '<td width="20%" style="padding:0 5px;"><a href="' . esc_url( $url_for( $n ) ) . '" style="display:block;background:#ffffff;border:1px solid #d9c7a3;text-align:center;padding:14px 0 12px;text-decoration:none;">'
			. mk_text( '★', 22, 400, '#c9a35a', 'text-align:center;line-height:1.1;' )
			. mk_text( (string) $n, 20, 800, '#16150f', 'text-align:center;line-height:1.1;' ) . '</a></td>';
	}
	return '<tr><td class="mk-pad" style="padding:14px 35px 0;">'
		. mk_text( 'לחצו על הציון', 13, 700, '#96661c', 'text-align:center;margin-bottom:14px;' )
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="ltr"><tr>' . $c . '</tr></table>'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="ltr" style="margin-top:8px;"><tr>'
		. '<td align="left" style="padding-left:5px;' . MIKRA_FONT . 'font-size:12px;color:#6f6c62;">מעולה</td>'
		. '<td align="right" style="padding-right:5px;' . MIKRA_FONT . 'font-size:12px;color:#6f6c62;text-align:right;">לא טוב</td>'
		. '</tr></table></td></tr>';
}

/** שלוש תמונות מרובעות בשורה, עם כותרת */
function mk_sq3( $title ) {
	$c = '';
	foreach ( array( 'sq-choose.jpg', 'sq-engrave.jpg', 'sq-pack.jpg' ) as $f ) {
		$c .= '<td class="mk-pcol" width="33%" style="padding:0 5px;"><img src="' . esc_url( MIKRA_IMG . $f ) . '" width="170" alt="" style="display:block;width:100%;height:auto;border:0;"></td>';
	}
	return '<tr><td class="mk-pad" style="padding:40px 30px 0;">'
		. mk_text( esc_html( $title ), 20, 800, '#16150f', 'text-align:center;margin-bottom:18px;' )
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>' . $c . '</tr></table></td></tr>';
}

/** שלוש קופסאות לבנות: מספר זהב גדול ומתחתיו מה הוא אומר */
function mk_fact_boxes( $items ) {
	$c = '';
	foreach ( $items as $it ) {
		$c .= '<td class="mk-pcol" width="33%" style="padding:0 5px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;"><tr><td align="center" style="padding:18px 6px;text-align:center;">'
			. mk_text( esc_html( $it[0] ), 26, 200, '#96661c', 'text-align:center;line-height:1.1;' )
			. mk_text( esc_html( $it[1] ), 12, 500, '#4a4840', 'text-align:center;margin-top:6px;' ) . '</td></tr></table></td>';
	}
	return '<tr><td class="mk-pad" style="padding:24px 30px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>' . $c . '</tr></table></td></tr>';
}

/** כותרת קטנה בתוך המייל ("לרגעים שבדרך") */
function mk_subhead( $text ) {
	return mk_row( mk_text( esc_html( $text ), 22, 800, '#16150f' ), '36px 44px 0' );
}

/**
 * מכתב: טקסט פשוט על לבן, בלי עיצוב - כמו מייל אישי. $paras הן שורות
 * HTML מוכנות (כבר מנוקות), $link אופציונלי בסוף
 */
function mk_letter( $title, $preheader, $paras, $unsub, $why = 'כי אישרת דיוור', $link = null ) {
	$body = '';
	foreach ( $paras as $p ) {
		$body .= '<p dir="rtl" style="margin:0 0 16px;direction:rtl;' . MIKRA_FONT . 'font-size:16px;line-height:1.65;color:#222222;">' . $p . '</p>';
	}
	if ( $link ) {
		$body .= '<p style="margin:4px 0 16px;' . MIKRA_FONT . 'font-size:16px;"><a href="' . esc_url( $link[1] ) . '" style="color:#96661c;text-decoration:underline;">' . esc_html( $link[0] ) . '</a></p>';
	}
	$foot = '—<br>מִקְרָא · גולדה מאיר 112, מודיעין · <span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span>'
		. ( $unsub ? '<br>קיבלת את המייל ' . esc_html( $why ) . '. <a href="' . esc_url( $unsub ) . '" style="color:#6f6c62;text-decoration:underline;">להסרה מרשימת התפוצה</a><br>זהו דיוור ישיר של מִקְרָא. למחיקת הפרטים מהמאגר - עונים למייל הזה.' : '' );
	return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' . esc_html( $title ) . '</title></head>'
		. '<body dir="rtl" style="margin:0;padding:0;background:#ffffff;"><div dir="rtl" lang="he" style="direction:rtl;">'
		. '<div style="display:none;max-height:0;overflow:hidden;">' . esc_html( $preheader ) . '</div>'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="right" style="padding:28px 24px;">'
		. '<table role="presentation" width="560" cellpadding="0" cellspacing="0" dir="rtl" style="width:100%;max-width:560px;text-align:right;"><tr><td align="right" style="text-align:right;">'
		. $body
		. '<p style="margin:26px 0 0;' . MIKRA_FONT . 'font-size:11px;line-height:1.7;color:#6f6c62;">' . $foot . '</p>'
		. '</td></tr></table></td></tr></table></div></body></html>';
}

/* ------------------------------------------------------------------
 * שליחה, תזמון והסרה
 * ------------------------------------------------------------------ */

function mikra_unsub_token( $user_id, $email ) {
	return substr( hash_hmac( 'sha256', $user_id . '|' . strtolower( $email ), wp_salt( 'auth' ) ), 0, 24 );
}

function mikra_unsub_url( $user_id, $email ) {
	return add_query_arg( array( 'mikra_unsub' => (int) $user_id, 't' => mikra_unsub_token( $user_id, $email ) ), home_url( '/' ) );
}

function mikra_send_html( $to, $subject, $html, $unsub = '' ) {
	$headers = array(
		'Content-Type: text/html; charset=UTF-8',
		'From: מקרא <' . MIKRA_FROM . '>',
		'Reply-To: מקרא <' . MIKRA_EMAIL . '>',
	);
	if ( $unsub ) {
		$headers[] = 'List-Unsubscribe: <' . $unsub . '>';
		$headers[] = 'List-Unsubscribe-Post: List-Unsubscribe=One-Click';
	}
	$ok = wp_mail( $to, $subject, $html, $headers );
	if ( function_exists( 'mikra_log' ) ) {
		mikra_log( $ok ? 'sent' : 'fail', '', $to, 0, $subject );
	}
	return $ok;
}

/** האם מותר לשלוח לנרשם הזה עכשיו */
function mikra_series_allowed( $user ) {
	if ( ! $user || ! $user->user_email ) {
		return false;
	}
	if ( get_user_meta( $user->ID, 'mikra_unsubscribed', true ) || mikra_is_suppressed( $user->user_email ) ) {
		return false;
	}
	if ( 0 !== strpos( (string) get_user_meta( $user->ID, 'הסכמה לדיוור', true ), 'כן' ) ) {
		return false;
	}
	if ( 'פופאפ מועדון' !== (string) get_user_meta( $user->ID, 'מקור', true ) ) {
		return false;
	}
	// מי שכבר קנה - לא שולחים לו "תקנה"
	$paid = wc_get_orders( array( 'customer' => $user->user_email, 'status' => array( 'wc-processing', 'wc-completed' ), 'limit' => 1, 'return' => 'ids' ) );
	return empty( $paid );
}

add_action( 'woocommerce_new_customer', 'mikra_series_start', 20, 1 );
function mikra_series_start( $user_id ) {
	// המקור וההסכמה נכתבים באותה בקשה; הבדיקה עצמה רצה בזמן השליחה
	if ( ! wp_next_scheduled( 'mikra_store_series', array( (int) $user_id, 1 ) ) ) {
		wp_schedule_single_event( time() + 90, 'mikra_store_series', array( (int) $user_id, 1 ) );
	}
}

add_action( 'mikra_store_series', 'mikra_series_run', 10, 2 );
function mikra_series_run( $user_id, $step ) {
	$user = get_userdata( $user_id );
	if ( ! mikra_series_allowed( $user ) || get_user_meta( $user_id, 'mikra_series_' . $step, true ) ) {
		return;
	}
	// מכתב 1 נשלח מיד: ביקשו אותו עכשיו (הקוד מהפופאפ). השאר - בחלון
	// השליחה, מייל אחד ביום, ומחכים בזמן שיש הזמנה פתוחה בזרימת נטישה
	if ( 1 !== (int) $step ) {
		$at = mikra_gate( $user->user_email );
		if ( ! $at && mikra_in_abandon( $user->user_email ) ) {
			$at = mikra_when( time() + DAY_IN_SECONDS );
		}
		if ( $at ) {
			wp_schedule_single_event( $at, 'mikra_store_series', array( (int) $user_id, (int) $step ) );
			return;
		}
	}
	$unsub = mikra_unsub_url( $user_id, $user->user_email );
	$mail  = mikra_series_email( $step, (string) get_user_meta( $user_id, 'first_name', true ), $unsub );
	if ( $mail && mikra_send_html( $user->user_email, $mail[0], $mail[1], $unsub ) ) {
		update_user_meta( $user_id, 'mikra_series_' . $step, time() );
		mikra_mark_sent( $user->user_email );
	}
	// סדר: 1 ברוכים הבאים · 3 למי המתנה · 2 העדשה · 4 על הגוף - בימים 0, 2, 4, 7
	$next = array( 1 => array( 3, 2 * DAY_IN_SECONDS ), 3 => array( 2, 2 * DAY_IN_SECONDS ), 2 => array( 4, 3 * DAY_IN_SECONDS ) );
	if ( isset( $next[ $step ] ) ) {
		wp_schedule_single_event( time() + $next[ $step ][1], 'mikra_store_series', array( (int) $user_id, $next[ $step ][0] ) );
	}
	// מכתב 5: יום לפני שהקוד פג, ב-10 בבוקר - ורק אם זה יותר מיום אחרי ההרשמה
	if ( 1 === (int) $step ) {
		$p = mikra_promo();
		if ( $p && $p['expires'] ) {
			$at = $p['expires'] - 14 * HOUR_IN_SECONDS;
			if ( $at > time() + DAY_IN_SECONDS ) {
				wp_schedule_single_event( $at, 'mikra_store_series', array( (int) $user_id, 5 ) );
			}
		}
	}
}

/** הסרה: GET מהקישור במייל, או POST בלחיצה אחת מג'ימייל */
add_action( 'init', 'mikra_series_unsubscribe', 1 );
function mikra_series_unsubscribe() {
	if ( empty( $_REQUEST['mikra_unsub'] ) ) {
		return;
	}
	$uid  = (int) $_REQUEST['mikra_unsub'];
	$tok  = isset( $_REQUEST['t'] ) ? (string) $_REQUEST['t'] : '';
	$user = get_userdata( $uid );
	if ( $user && hash_equals( mikra_unsub_token( $uid, $user->user_email ), $tok ) ) {
		mikra_suppress( $user->user_email ); // גם מהזרימות של ההזמנות, לא רק מהסדרה
	}
	if ( 'POST' === strtoupper( (string) ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) ) {
		status_header( 200 );
		exit;
	}
	wp_redirect( MIKRA_SITE . '/unsubscribed', 302, 'Mikra' );
	exit;
}

/**
 * בדיקה: שולח מכתב מהסדרה לכתובת שנבחרה, מיד. מוגן במפתחות ווקומרס
 * (המרחב wc/ מאומת על ידי ווקומרס). POST /wp-json/wc/mikra/series-test
 * { email, step: 1-5, name }
 */
add_action( 'rest_api_init', 'mikra_series_rest' );
function mikra_series_rest() {
	register_rest_route(
		'wc/mikra',
		'/series-test',
		array(
			'methods'             => 'POST',
			'permission_callback' => function () {
				return current_user_can( 'manage_woocommerce' );
			},
			'callback'            => function ( $req ) {
				$to   = sanitize_email( (string) $req->get_param( 'email' ) );
				$step = (int) $req->get_param( 'step' );
				$name = sanitize_text_field( (string) $req->get_param( 'name' ) );
				if ( ! $to ) {
					return new WP_Error( 'mikra_email', 'missing email', array( 'status' => 400 ) );
				}
				$mail = mikra_series_email( $step, $name, home_url( '/?mikra_unsub=0&t=test' ) );
				if ( ! $mail ) {
					return array( 'sent' => false, 'reason' => 'no email for this step (or no active promo)' );
				}
				return array( 'sent' => (bool) mikra_send_html( $to, '[בדיקה] ' . $mail[0], $mail[1] ), 'subject' => $mail[0] );
			},
		)
	);
}
