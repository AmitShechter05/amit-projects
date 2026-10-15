<?php
/**
 * Plugin Name: Mikra Store
 * Description: מיילים מעוצבים ללקוחות, סדרת הצטרפות, זרימות נטישה / אחרי הזמנה / חזרה, והפניית החנות הישנה (wp.mikra.shop) אל mikra.shop.
 * Version: 1.5.0
 * Author: Mikra
 * Requires PHP: 7.4
 * Text Domain: mikra-store
 *
 * האתר עצמו הוא mikra.shop (Next.js). הוורדפרס כאן משמש רק כמנוע החנות:
 * הזמנות, מלאי, התוסף של Grow והמיילים. התוסף הזה עושה שלושה דברים:
 *   1. מחליף את תבניות המייל של ווקומרס בעיצוב של האתר (templates/emails/).
 *   2. מפנה מבקרים מהחנות הישנה אל mikra.shop - חוץ מהניהול, התשלומים,
 *      ה-API וההודעות של Grow.
 *   3. מסמן את כל הוורדפרס "לא לאינדקס", כדי שגוגל לא יציג חנות שנייה.
 *
 * לכבות = לנטרל את התוסף. שום דבר אחר לא תלוי בו.
 */

defined( 'ABSPATH' ) || exit;

define( 'MIKRA_STORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'MIKRA_SITE', 'https://mikra.shop' );
define( 'MIKRA_WHATSAPP', '972533714872' );
define( 'MIKRA_PHONE', '053-371-4872' );
define( 'MIKRA_EMAIL', 'mikrajewelry@gmail.com' );

// סדרת ההצטרפות (שיווק) והבלוקים של העיצוב החדש
require_once MIKRA_STORE_DIR . 'includes/marketing.php';
// זרימות: נטישה, אחרי הזמנה, חזרה - עם חלון שליחה, שבת וחג
require_once MIKRA_STORE_DIR . 'includes/flows.php';
// מלאי לפי ברכה: יורד בתשלום, חוזר בביטול, ומסך עדכון בווקומרס
require_once MIKRA_STORE_DIR . 'includes/stock.php';
// כרטיס מתנה: קוד בתשלום, מייל למקבל בתאריך שנבחר, ויתרה שנשמרת
require_once MIKRA_STORE_DIR . 'includes/giftcard.php';
// עגלה נטושה לפני הקופה (למי שהאתר יודע מי הוא)
require_once MIKRA_STORE_DIR . 'includes/cart.php';
// מסך "מקרא · אוטומציות" בניהול: מי בזרימה, מה יוצא, מי יצא ולמה
if ( is_admin() ) {
	require_once MIKRA_STORE_DIR . 'includes/admin.php';
}

/* ------------------------------------------------------------------
 * 1. תבניות המייל
 * ------------------------------------------------------------------ */

/**
 * ווקומרס מחפש כל תבנית קודם בתבנית העיצוב ואז אצלו. כאן מכניסים את
 * שלנו לפני שניהם - רק לקבצים שקיימים אצלנו, ורק ל-HTML (המייל
 * בטקסט פשוט נשאר כמו שהוא).
 */
add_filter( 'woocommerce_locate_template', 'mikra_store_locate_template', 20, 3 );
function mikra_store_locate_template( $template, $template_name, $template_path ) {
	if ( 0 !== strpos( (string) $template_name, 'emails/' ) || 0 === strpos( (string) $template_name, 'emails/plain/' ) ) {
		return $template;
	}
	$ours = MIKRA_STORE_DIR . 'templates/' . $template_name;
	return file_exists( $ours ) ? $ours : $template;
}

/**
 * איזה מייל נבנה עכשיו.
 *
 * ווקומרס טוען את email-header.php ו-email-footer.php בלי אובייקט המייל
 * (WC_Emails::email_header מקבל רק את הכותרת), ולכן התבנית לא יודעת אם
 * זה מייל ללקוח ואיזה. כאן תופסים את האובייקט מאותו do_action, לפני
 * ווקומרס, ושומרים אותו לתבניות (התגלה במייל הבדיקה, 12.10.2026: בלי
 * תמונה ובלי וואטסאפ).
 */
add_action( 'woocommerce_email_header', 'mikra_store_remember_email', 1, 2 );
add_action( 'woocommerce_email_footer', 'mikra_store_remember_email_footer', 1, 1 );
function mikra_store_remember_email( $email_heading, $email = null ) {
	if ( is_object( $email ) ) {
		$GLOBALS['mikra_store_email'] = $email;
	}
}
function mikra_store_remember_email_footer( $email = null ) {
	if ( is_object( $email ) ) {
		$GLOBALS['mikra_store_email'] = $email;
	}
}

/** המייל שנבנה עכשיו, אם ידוע */
function mikra_store_current_email( $email = null ) {
	if ( is_object( $email ) ) {
		return $email;
	}
	return ( isset( $GLOBALS['mikra_store_email'] ) && is_object( $GLOBALS['mikra_store_email'] ) ) ? $GLOBALS['mikra_store_email'] : null;
}

/** כתובת עמוד התשלום שלנו להזמנה (חלון Grow בתוך mikra.shop) */
function mikra_store_pay_url( $order ) {
	return MIKRA_SITE . '/checkout/pay?o=' . $order->get_id() . '&k=' . rawurlencode( $order->get_order_key() );
}

/** קישור וואטסאפ שנפתח עם מספר ההזמנה */
function mikra_store_wa_url( $order = null ) {
	$text = $order ? 'שלום, לגבי הזמנה #' . $order->get_order_number() : 'שלום';
	return 'https://wa.me/' . MIKRA_WHATSAPP . '?text=' . rawurlencode( $text );
}

/**
 * תמונת המוצר. התמונות של האתר יושבות ב-mikra.shop לפי מק"ט (JPEG על
 * לבן, אותן תמונות של הפיד - WebP לא נטען באאוטלוק). אם אין מק"ט
 * כזה, תמונת המוצר בווקומרס, ואם גם היא חסרה - בלי תמונה.
 */
function mikra_store_item_image( $item ) {
	$product = is_callable( array( $item, 'get_product' ) ) ? $item->get_product() : null;
	if ( ! $product ) {
		return '';
	}
	$sku = (string) $product->get_sku();
	if ( preg_match( '/^[A-Z]{3,6}[0-9]{2,4}[A-Z]{0,3}$/', $sku ) ) {
		return MIKRA_SITE . '/products/' . $sku . '.jpg';
	}
	$image_id = $product->get_image_id();
	if ( $image_id ) {
		$url = wp_get_attachment_image_url( $image_id, 'woocommerce_thumbnail' );
		return $url ? $url : '';
	}
	return '';
}

/** "₪279" - בלי אגורות כשאין, כמו באתר */
function mikra_store_money( $amount, $order ) {
	$amount   = (float) $amount;
	$decimals = ( abs( $amount - round( $amount ) ) < 0.005 ) ? 0 : 2;
	return wc_price( $amount, array( 'currency' => $order->get_currency(), 'decimals' => $decimals ) );
}

/**
 * גוף המייל: פתיח, מספר הזמנה, מה הוזמן, סיכום, לאן נשלח, ואופציונלית
 * "מה קורה עכשיו" וכפתור לתשלום. כל תבנית customer-*.php קוראת לכאן
 * עם הטקסטים שלה.
 *
 * @param WC_Order $order
 * @param array    $args intro, total_label, steps, pay_button, note
 */
function mikra_store_email_body( $order, $args ) {
	$args = wp_parse_args(
		$args,
		array(
			'eyebrow'     => '',
			'intro'       => '',
			'total_label' => 'סה״כ',
			'steps'       => false,
			'pay_button'  => false,
			'note'        => '',
		)
	);
	include MIKRA_STORE_DIR . 'templates/parts/body.php';
}

/* ------------------------------------------------------------------
 * 1א. הזמנה שלא שולמה = נטישה (includes/flows.php)
 * ------------------------------------------------------------------
 *
 * עד 1.2 נשלחה כאן "תזכורת לתשלום" אחת, ובווקומרס גם "התשלום נכשל".
 * מ-1.3 שניהם הוחלפו בזרימת הנטישה. מייל "התשלום נכשל" ללקוח כבוי,
 * כדי שלא יגיעו שני מיילים על אותו רגע.
 */

add_filter( 'woocommerce_email_enabled_customer_failed_order', '__return_false' );

/** אירועי ביטול שתוזמנו בגרסה 1.2, לפני העדכון */
add_action( 'mikra_store_expire', 'mikra_store_expire_order' );
function mikra_store_expire_order( $order_id ) {
	$order = wc_get_order( $order_id );
	if ( $order && 'pending' === $order->get_status() && ! $order->get_meta( '_mikra_ab_base' ) ) {
		$order->update_status( 'cancelled', 'לא שולמה יום אחרי התזכורת.' );
	}
}

/* ------------------------------------------------------------------
 * 2. הפניית החנות הישנה אל mikra.shop
 * ------------------------------------------------------------------ */

/**
 * כל מבקר בחזית של wp.mikra.shop עובר ל-mikra.shop. נשארים פתוחים:
 * הניהול, admin-ajax (Grow מבקשים ממנו אסימון), ה-REST API (האתר קורא
 * ממנו מחירים ויוצר הזמנות), wc-api והודעות סולקים, cron, בקשות שאינן
 * GET, דף "שלם עבור ההזמנה" ודף "ההזמנה התקבלה" של ווקומרס, ומנהל
 * מחובר.
 */
add_action( 'template_redirect', 'mikra_store_redirect', 1 );
function mikra_store_redirect() {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	$method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( (string) $_SERVER['REQUEST_METHOD'] ) : 'GET';
	if ( 'GET' !== $method && 'HEAD' !== $method ) {
		return;
	}
	if ( isset( $_GET['wc-api'] ) || isset( $_GET['wc-ajax'] ) ) {
		return;
	}
	// הודעות של סולקים שמגיעות כ-GET עם פרמטרים משלהן
	foreach ( array_keys( $_GET ) as $key ) {
		if ( preg_match( '/meshulam|grow|bit|payment|response|status|transaction|order/i', (string) $key ) ) {
			return;
		}
	}
	if ( is_user_logged_in() && current_user_can( 'edit_posts' ) ) {
		return;
	}
	if ( function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ) {
		return;
	}
	if ( function_exists( 'is_wc_endpoint_url' ) && is_wc_endpoint_url( 'order-received' ) ) {
		return;
	}

	$target = MIKRA_SITE . '/';
	if ( function_exists( 'is_product' ) && ( is_product() || is_shop() || is_product_category() || is_product_tag() ) ) {
		$target = MIKRA_SITE . '/catalog';
	}
	wp_redirect( $target, 301, 'Mikra' );
	exit;
}

/* ------------------------------------------------------------------
 * 3. לא לאינדקס
 * ------------------------------------------------------------------ */

add_filter( 'wp_robots', 'mikra_store_robots' );
function mikra_store_robots( $robots ) {
	$robots['noindex']  = true;
	$robots['nofollow'] = true;
	unset( $robots['max-image-preview'] );
	return $robots;
}

add_action( 'send_headers', 'mikra_store_noindex_header' );
function mikra_store_noindex_header() {
	if ( ! headers_sent() ) {
		header( 'X-Robots-Tag: noindex, nofollow', true );
	}
}
