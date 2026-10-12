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

const MIKRA_FONT = "font-family:Heebo,'Segoe UI',Arial,sans-serif;";

function mk_text( $text, $size, $weight, $color, $extra = '' ) {
	return '<p style="margin:0;' . MIKRA_FONT . 'font-size:' . $size . 'px;font-weight:' . $weight . ';color:' . $color . ';' . $extra . '">' . $text . '</p>';
}

function mk_row( $inner, $pad = '0 40px', $bg = '' ) {
	return '<tr><td class="mk-pad" align="right" style="padding:' . $pad . ';' . ( $bg ? 'background:' . $bg . ';' : '' ) . 'text-align:right;">' . $inner . '</td></tr>';
}

function mk_topbar( $label ) {
	return '<tr><td style="padding:26px 36px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr>'
		. '<td align="right"><a href="' . esc_url( MIKRA_SITE ) . '"><img src="' . esc_url( MIKRA_SITE . '/brand/mikra-logo-email.png' ) . '" width="124" alt="מִקְרָא" style="display:block;width:124px;height:auto;border:0;"></a></td>'
		. '<td align="left" style="' . MIKRA_FONT . 'font-size:12px;font-weight:500;color:#8a877c;text-align:left;">' . esc_html( $label ) . '</td>'
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

/** כרטיס הקופון: אחוז ענק דק, ניקוב, והקוד */
function mk_ticket( $promo, $lead = 'הקוד שלך' ) {
	if ( ! $promo ) {
		return '';
	}
	$until = $promo['until'] ? 'מקלידים בקופה · בתוקף עד ' . $promo['until'] : 'מקלידים בקופה';
	return '<tr><td class="mk-pad" style="padding:28px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#f3ead8;"><tr>'
		. '<td align="right" style="padding:28px 30px 28px 18px;text-align:right;">'
		. mk_text( esc_html( $lead ), 14, 300, '#4a4840' )
		. mk_text( '<span dir="ltr">' . esc_html( $promo['code'] ) . '</span>', 32, 800, '#16150f', 'letter-spacing:2px;line-height:1.2;margin:4px 0;' )
		. mk_text( esc_html( $until ), 12, 400, '#8a877c' )
		. '</td><td width="1" style="border-right:2px dashed #d9c7a3;font-size:0;">&nbsp;</td>'
		. '<td align="center" width="150" style="padding:24px 18px;text-align:center;">'
		. mk_text( '<span dir="ltr">' . (int) $promo['percent'] . '%</span>', 58, 200, '#96661c', 'line-height:1;text-align:center;' )
		. mk_text( 'על כל האתר', 12, 500, '#4a4840', 'text-align:center;margin-top:6px;' )
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

/** אינדקס חמש הברכות, ליד תמונה גבוהה של השרשראות */
function mk_blessing_index( $campaign ) {
	$list = array(
		array( 'אשת חיל', 'לאמא, לאישה, לסבתא', 'eshet-chayil' ),
		array( 'ברכת התינוק', 'לתינוק שנולד', 'tinok' ),
		array( 'שמירה והגנה', 'למי שיוצא לדרך', 'shmira' ),
		array( 'ברכת הפרנסה', 'למי שבונה משהו', 'parnasa' ),
		array( 'הברכה שלך', 'לכל רגע של התחלה', 'bracha' ),
	);
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
		. mk_text( 'חמש ברכות לבחירה', 12, 700, '#96661c' )
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
		array( 'א', 'בוחרים', 'תכשיט, ואחת מחמש ברכות. אפשר לקרוא כל ברכה לפני שקונים.', 'step-choose-c.png' ),
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

/** רצועת המשי הכחול עם פסוק. רקע מתמונה, וצבע אחיד לאאוטלוק */
function mk_quote_band( $kicker, $verse, $source ) {
	return '<tr><td background="' . esc_url( MIKRA_IMG . 'navy-silk.jpg' ) . '" bgcolor="#141a2e" align="center" style="background:#141a2e url(' . esc_url( MIKRA_IMG . 'navy-silk.jpg' ) . ') center/cover no-repeat;padding:96px 50px 70px;text-align:center;">'
		. mk_text( esc_html( $kicker ), 12, 700, '#fbf8f1', 'text-align:center;opacity:.85;' )
		. mk_text( $verse, 34, 200, '#fbf8f1', 'text-align:center;line-height:1.4;margin-top:16px;' )
		. '<div style="width:40px;height:1px;line-height:1px;background:#c9a35a;margin:20px auto 14px;">&nbsp;</div>'
		. mk_text( esc_html( $source ), 12, 400, '#a9a594', 'text-align:center;' ) . '</td></tr>';
}

function mk_signoff( $text ) {
	return '<tr><td class="mk-pad" align="right" style="padding:46px 44px 0;text-align:right;">'
		. mk_text( $text, 15, 300, '#4a4840', 'line-height:1.7;' )
		. mk_text( 'צוות מִקְרָא', 15, 500, '#16150f', 'margin-top:8px;' ) . '</td></tr>';
}

function mk_footer( $unsub = '' ) {
	$u = $unsub ? '<br>קיבלת את המייל כי נרשמת באתר. <a href="' . esc_url( $unsub ) . '" style="color:#8a877c;text-decoration:underline;">להסרה מרשימת התפוצה</a>' : '';
	return '<tr><td align="center" style="padding:40px 30px 36px;' . MIKRA_FONT . 'font-size:11px;line-height:1.8;color:#8a877c;text-align:center;">'
		. 'מִקְרָא · תכשיטים עם ברכה חרוטה · גולדה מאיר 112, מודיעין<br>'
		. '<a href="' . esc_url( MIKRA_SITE ) . '" style="color:#96661c;text-decoration:none;">mikra.shop</a> · <span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span> · ' . esc_html( MIKRA_EMAIL )
		. $u . '</td></tr>';
}

/** המעטפת: html, טבלת 600 ושורות */
function mk_wrap( $title, $preheader, $rows ) {
	return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
		. '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' . esc_html( $title ) . '</title>'
		. '<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@200;300;500;700;800&display=swap" rel="stylesheet">'
		. '<style>body{margin:0;padding:0;background:#fbf8f1}a{text-decoration:none}'
		. '@media (max-width:620px){.mk-wrap{width:100%!important}.mk-pad{padding-left:20px!important;padding-right:20px!important}'
		. '.mk-col{display:block!important;width:100%!important;padding:0 0 18px!important}.mk-hide{display:none!important}'
		. '.mk-h p{font-size:38px!important}.mk-pcol{padding:0 3px!important}}</style></head>'
		. '<body dir="rtl" style="margin:0;padding:0;background:#fbf8f1;">'
		. '<div style="display:none;max-height:0;overflow:hidden;">' . esc_html( $preheader ) . '</div>'
		. '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fbf8f1;"><tr><td align="center">'
		. '<table role="presentation" class="mk-wrap" width="600" cellpadding="0" cellspacing="0" dir="rtl" style="width:600px;max-width:600px;background:#fbf8f1;' . MIKRA_FONT . 'color:#16150f;">'
		. $rows . '</table></td></tr></table></body></html>';
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
				. ( $p ? mk_para( $hi . 'הבטחנו לך הנחה. הנה היא:', '34px 40px 0' ) . mk_ticket( $p ) : mk_para( $hi . 'שמחים שהצטרפת.', '34px 40px 0' ) )
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
			$subject = $p ? 'פרסומת: ברוכים הבאים למִקְרָא · ההנחה שלך בפנים' : 'פרסומת: ברוכים הבאים למִקְרָא';
			$pre     = $p ? 'הקוד שלך ל-' . $p['percent'] . '% הנחה על כל האתר.' : 'ברכה שלמה, על שבב של 5 מ״מ.';
			break;

		case 2:
			$rows = mk_topbar( 'איך זה נעשה · מכתב 2' )
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
			$pick = array(
				array( 'לאמא, לאישה, לסבתא', 'אשת חיל', 'אֵשֶׁת חַיִל מִי יִמְצָא,<br>וְרָחֹק מִפְּנִינִים מִכְרָהּ', 'eshet-chayil', 'kachotam', 'OYANN001G', 'כַּחוֹתָם', 'm3-kachotam.jpg' ),
				array( 'לתינוק שנולד', 'ברכת התינוק', 'יְבָרֶכְךָ ה׳<br>וְיִשְׁמְרֶךָ', 'tinok', 'tzel-knafayim', 'BABYPIN01', 'צֵל כְּנָפַיִם', 'm3-tzel.jpg' ),
				array( 'למי שיוצא לדרך', 'שמירה והגנה', 'יֹשֵׁב בְּסֵתֶר עֶלְיוֹן,<br>בְּצֵל שַׁדַּי יִתְלוֹנָן', 'shmira', 'beseter', 'OYANN003S', 'בְּסֵתֶר', 'm3-beseter.jpg' ),
				array( 'למי שבונה משהו', 'ברכת הפרנסה', 'לַה׳ הָאָרֶץ וּמְלוֹאָהּ,<br>תֵּבֵל וְיֹשְׁבֵי בָהּ', 'parnasa', 'avot', 'OYANB007RS', 'עֲבוֹת', 'm3-avot.jpg' ),
				array( 'לכל רגע של התחלה', 'הברכה שלך', 'וּבָאוּ עָלֶיךָ כָּל הַבְּרָכוֹת<br>הָאֵלֶּה וְהִשִּׂיגֻךָ', 'bracha', 'toldot', 'YASNN004W', 'תּוֹלְדוֹת', 'm3-toldot.jpg' ),
			);
			$rows = mk_topbar( 'למי המתנה · מכתב 3' )
				. mk_heading( 'חמש ברכות, חמישה רגעים', 'למי', 'המתנה?', $hi . 'כל ברכה נכתבה לרגע אחר בחיים. ככה בוחרים: מתחילים ממי שמקבל.', 56 );
			foreach ( $pick as $i => $b ) {
				list( $who, $name, $verse, $bslug, $pslug, $sku, $pname, $img ) = $b;
				$price = mikra_sku_price( $sku );
				$img_td = '<td class="mk-col" width="250" style="vertical-align:middle;"><a href="' . esc_url( mikra_utm( '/products/' . $pslug, $camp ) ) . '"><img src="' . esc_url( MIKRA_IMG . $img ) . '" width="250" alt="' . esc_attr( $pname ) . '" style="display:block;width:100%;height:auto;border:0;"></a></td>';
				$txt_td = '<td class="mk-col" align="right" style="vertical-align:middle;text-align:right;padding:0 28px;">'
					. mk_text( esc_html( $who ), 12, 700, '#96661c' )
					. mk_text( esc_html( $name ), 30, 200, '#16150f', 'line-height:1.15;margin-top:6px;' )
					. mk_text( $verse, 14, 300, '#4a4840', 'line-height:1.6;margin-top:10px;' )
					. mk_text( esc_html( $pname ) . ( $price ? ' · ' . esc_html( $price ) : '' ), 14, 800, '#16150f', 'margin-top:14px;' )
					. '<p style="margin:8px 0 0;' . MIKRA_FONT . 'font-size:13px;font-weight:500;"><a href="' . esc_url( mikra_utm( '/blessings/' . $bslug, $camp ) ) . '" style="color:#96661c;text-decoration:underline;">לקריאת הברכה</a> &nbsp;·&nbsp; <a href="' . esc_url( mikra_utm( '/products/' . $pslug, $camp ) ) . '" style="color:#96661c;text-decoration:underline;">לתכשיט</a></p>'
					. '</td>';
				// מתחלף צד: dir="ltr" הופך את סדר העמודות בלי לשנות את הטקסט
				$rows .= '<tr><td style="padding:' . ( 0 === $i ? '36px' : '18px' ) . ' 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="' . ( 0 === $i % 2 ? 'rtl' : 'ltr' ) . '" style="background:#ffffff;"><tr>' . $img_td . $txt_td . '</tr></table></td></tr>';
			}
			$rows .= mk_ticket( $p ) . mk_button( 'לכל התכשיטים', mikra_utm( '/catalog', $camp ) )
				. mk_signoff( 'עדיין לא בטוחים? עונים למייל הזה וכותבים למי המתנה ולאיזה רגע. נציע ברכה ותכשיט.' );
			$subject = 'פרסומת: למי המתנה? ככה בוחרים ברכה';
			$pre     = 'חמש ברכות, חמישה רגעים - ותכשיט לכל אחת.';
			break;

		case 4:
			$rows = mk_topbar( 'ככה זה נראה · מכתב 4' )
				. mk_image( 'm4-hero.jpg', 'זוג עונד צמידים של מקרא' )
				. mk_heading( 'קטן מספיק ליום-יום', 'ככה זה נראה', 'עליכם.', $hi . 'שבב של 5 מ״מ לא מושך תשומת לב. מי שעונד יודע מה כתוב עליו, וזה מספיק.', 50 )
				. '<tr><td class="mk-pad" style="padding:34px 30px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl">'
				. '<tr>' . mk4_cell( 'tipat-or', 'YASNN010W', 'טִפַּת אוֹר', 'm4-tipat.jpg', $camp ) . mk4_cell( 'beseter', 'OYANN003S', 'בְּסֵתֶר', 'm4-beseter.jpg', $camp ) . '</tr>'
				. '<tr>' . mk4_cell( 'ahavat-olam', 'YASNB001W', 'אַהֲבַת עוֹלָם', 'm4-ahavat.jpg', $camp ) . mk4_cell( 'avot-black', 'OYANB007B', 'עֲבוֹת', 'm4-avot-black.jpg', $camp ) . '</tr>'
				. '</table></td></tr>'
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
	return wp_mail( $to, $subject, $html, $headers );
}

/** האם מותר לשלוח לנרשם הזה עכשיו */
function mikra_series_allowed( $user ) {
	if ( ! $user || ! $user->user_email ) {
		return false;
	}
	if ( get_user_meta( $user->ID, 'mikra_unsubscribed', true ) ) {
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
	$unsub = mikra_unsub_url( $user_id, $user->user_email );
	$mail  = mikra_series_email( $step, (string) get_user_meta( $user_id, 'first_name', true ), $unsub );
	if ( $mail && mikra_send_html( $user->user_email, $mail[0], $mail[1], $unsub ) ) {
		update_user_meta( $user_id, 'mikra_series_' . $step, time() );
	}
	$next = array( 1 => array( 2, DAY_IN_SECONDS ), 2 => array( 3, 2 * DAY_IN_SECONDS ), 3 => array( 4, 2 * DAY_IN_SECONDS ) );
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
		update_user_meta( $uid, 'mikra_unsubscribed', time() );
		update_user_meta( $uid, 'הסכמה לדיוור', 'לא · הוסר ' . wp_date( 'Y-m-d H:i' ) );
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
