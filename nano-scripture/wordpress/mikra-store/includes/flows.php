<?php
/**
 * שלוש זרימות מיילים, לפי מפות הזרימה בפיגמה (קובץ "מקרא - מיילים",
 * 12.10.2026, עמודים 2-4):
 *
 *   נטישה    - הזמנה שנוצרה בקופה של mikra.shop ולא שולמה. מחליפה את
 *               "תזכורת לתשלום" ואת מייל "התשלום נכשל" של ווקומרס.
 *               חדש: 20 דק׳ / למחרת 10:00 הוכחה (מיקרוסקופ, תשלומים,
 *               החזרות) / יומיים אחרי 10:00 הנחה (קוד ההצטרפות אם לא
 *               נוצל, אחרת 10% אישי) / מכתב שלושה ימים אחרי 19:30.
 *               חוזר (כבר קנה): 30 דק׳ / מכתב יומיים אחרי 19:30.
 *   אחרי הזמנה - מסימון "הושלמה" (נשלח): 4 ימים 10:00 איך שומרים /
 *               10 ימים 10:00 עוד ברכה / 14 ימים 19:30 ביקורת.
 *               לקוח חוזר מקבל גם מכתב תודה יום אחרי התשלום, 19:30.
 *   חזרה      - X ימים בלי קנייה (MIKRA_WINBACK_DAYS): "מה חדש אצלך?".
 *               ההטבה, התזכורת והמכתב כבויים עד שיוחלט (ראו הקבועים).
 *
 * כללים לכולן: רק עם הסכמה לדיוור (חוץ מתזכורת אחת על הזמנה, שנשלחת
 * כמייל שירות בלי "פרסומת"). לא בשבת ובחגים, רק 08:00-21:30 שעון
 * ישראל, ולכל היותר מייל שיווקי אחד ב-20 שעות. כל שלב נבדק מחדש
 * ברגע השליחה: עדיין לא קנה, לא הוסר, ההזמנה לא בוטלה.
 */

defined( 'ABSPATH' ) || exit;

/** כמה ימים בלי קנייה עד "מה חדש אצלך?" */
define( 'MIKRA_WINBACK_DAYS', 90 );
/** לא נכנסים לזרימת החזרה שוב לפני שעבר הזמן הזה */
define( 'MIKRA_WINBACK_REPEAT', 180 * DAY_IN_SECONDS );
/**
 * מכתבים 2-3 של החזרה (קוד אישי 10%). כבוי: הקופה של mikra.shop מקבלת
 * היום רק את קוד ההצטרפות, ולכן קוד אחר שיוקלד שם יידחה. להדליק
 * כשהקופה תדע לבדוק קופונים של ווקומרס.
 */
define( 'MIKRA_WINBACK_COUPONS', false );
/**
 * מכתב החזרה האחרון ("שאלה קטנה ממני") צריך 2-3 שורות אמיתיות על איך
 * התחילה מקרא. ריק = המכתב לא נשלח. לא ממציאים סיפור.
 */
define( 'MIKRA_FOUNDER_STORY', '' );
/** לאן מובילים כפתורי הביקורת. ריק = תשובה במייל, עם הציון בנושא */
define( 'MIKRA_REVIEW_URL', '' );

/* ------------------------------------------------------------------
 * זמנים: חלון שליחה, שבת וחג
 * ------------------------------------------------------------------ */

function mikra_tz() {
	return new DateTimeZone( 'Asia/Jerusalem' );
}

/** ימי יום טוב בישראל (hebcal, i=on). אחרי 2028 צריך להוסיף */
function mikra_holidays() {
	return array(
		'2026-04-02', '2026-04-08', '2026-05-22', '2026-09-12', '2026-09-13', '2026-09-21', '2026-09-26', '2026-10-03',
		'2027-04-22', '2027-04-28', '2027-06-11', '2027-10-02', '2027-10-03', '2027-10-11', '2027-10-16', '2027-10-23',
		'2028-04-11', '2028-04-17', '2028-05-31', '2028-09-21', '2028-09-22', '2028-09-30', '2028-10-05', '2028-10-12',
	);
}

function mikra_is_rest_day( DateTime $d ) {
	return '6' === $d->format( 'w' ) || in_array( $d->format( 'Y-m-d' ), mikra_holidays(), true );
}

/**
 * הרגע המותר הראשון מ-$ts והלאה: לא משישי/ערב חג 14:00 ועד מוצאי
 * שבת/חג 20:30, ורק בין 08:00 ל-21:30.
 */
function mikra_when( $ts ) {
	$d = ( new DateTime( '@' . (int) $ts ) )->setTimezone( mikra_tz() );
	for ( $i = 0; $i < 20; $i++ ) {
		$hm       = $d->format( 'H:i' );
		$tomorrow = ( clone $d )->modify( '+1 day' );
		if ( mikra_is_rest_day( $d ) && $hm < '20:30' ) {
			$d->setTime( 20, 30 );
			continue;
		}
		if ( mikra_is_rest_day( $tomorrow ) && $hm >= '14:00' ) {
			$d = $tomorrow->setTime( 20, 30 );
			continue;
		}
		if ( $hm < '08:00' ) {
			$d->setTime( 8, 0 );
			continue;
		}
		if ( $hm > '21:30' ) {
			$d = $tomorrow->setTime( 8, 0 );
			continue;
		}
		break;
	}
	return $d->getTimestamp();
}

/** "יומיים אחרי, 19:30" - שעון ישראל, מהיום של $base */
function mikra_day_at( $base, $days, $hm ) {
	list( $h, $m ) = array_map( 'intval', explode( ':', $hm ) );
	$d             = ( new DateTime( '@' . (int) $base ) )->setTimezone( mikra_tz() );
	return $d->modify( '+' . (int) $days . ' day' )->setTime( $h, $m )->getTimestamp();
}

/* ------------------------------------------------------------------
 * מי מקבל: הסכמה, הסרה, ומייל אחד ביום
 * ------------------------------------------------------------------ */

function mikra_ekey( $email ) {
	return sha1( strtolower( trim( (string) $email ) ) );
}

function mikra_is_suppressed( $email ) {
	$list = get_option( 'mikra_suppressed', array() );
	return is_array( $list ) && isset( $list[ mikra_ekey( $email ) ] );
}

function mikra_suppress( $email ) {
	$list = get_option( 'mikra_suppressed', array() );
	$list = is_array( $list ) ? $list : array();
	$list[ mikra_ekey( $email ) ] = time();
	update_option( 'mikra_suppressed', $list, false );
	mikra_log( 'unsub', '', $email, 0, 'הוסר מרשימת התפוצה' );
	$user = get_user_by( 'email', $email );
	if ( $user ) {
		update_user_meta( $user->ID, 'mikra_unsubscribed', time() );
		update_user_meta( $user->ID, 'הסכמה לדיוור', 'לא · הוסר ' . wp_date( 'Y-m-d H:i' ) );
	}
}

/**
 * הסכמה לדיוור: מההזמנה האחרונה של הכתובת (תיבת הסימון בקופה), או
 * מהמשתמש (פופאפ). מי שהוסר לא מקבל - אלא אם אחרי ההסרה סימן שוב
 * "כן" בקופה, בהזמנה חדשה.
 */
function mikra_consent( $email ) {
	if ( ! $email ) {
		return false;
	}
	$removed = 0;
	$list    = get_option( 'mikra_suppressed', array() );
	if ( is_array( $list ) && isset( $list[ mikra_ekey( $email ) ] ) ) {
		$removed = (int) $list[ mikra_ekey( $email ) ];
	}
	$orders = wc_get_orders( array( 'customer' => $email, 'limit' => 1, 'orderby' => 'date', 'order' => 'DESC' ) );
	if ( $orders ) {
		$o       = $orders[0];
		$created = $o->get_date_created() ? $o->get_date_created()->getTimestamp() : 0;
		if ( 0 === strpos( (string) $o->get_meta( 'הסכמה לדיוור' ), 'כן' ) && $created > $removed ) {
			return true;
		}
	}
	if ( $removed ) {
		return false;
	}
	$user = get_user_by( 'email', $email );
	return $user && 0 === strpos( (string) get_user_meta( $user->ID, 'הסכמה לדיוור', true ), 'כן' );
}

function mikra_last_send( $email ) {
	$m = get_option( 'mikra_last_send', array() );
	return ( is_array( $m ) && isset( $m[ mikra_ekey( $email ) ] ) ) ? (int) $m[ mikra_ekey( $email ) ] : 0;
}

function mikra_mark_sent( $email ) {
	$m = get_option( 'mikra_last_send', array() );
	$m = is_array( $m ) ? $m : array();
	foreach ( $m as $k => $t ) {
		if ( $t < time() - 3 * DAY_IN_SECONDS ) {
			unset( $m[ $k ] );
		}
	}
	$m[ mikra_ekey( $email ) ] = time();
	update_option( 'mikra_last_send', $m, false );
}

/**
 * אם עכשיו אסור לשלוח - מתי כן. 0 = מותר עכשיו. $rate=false למייל
 * שאסור לעכב בגלל מייל אחר (התזכורת הראשונה על הזמנה)
 */
function mikra_gate( $email, $rate = true ) {
	$now  = time();
	$when = mikra_when( $now );
	if ( $rate ) {
		$last = mikra_last_send( $email );
		if ( $last && $now - $last < 20 * HOUR_IN_SECONDS ) {
			$when = max( $when, mikra_when( $last + DAY_IN_SECONDS ) );
		}
	}
	return $when > $now + 5 * MINUTE_IN_SECONDS ? $when : 0;
}

/** כתובת שנמצאת עכשיו בזרימת נטישה - סדרת ההצטרפות מחכה לה */
function mikra_in_abandon( $email ) {
	$m = get_option( 'mikra_abandoning', array() );
	return is_array( $m ) && isset( $m[ mikra_ekey( $email ) ] ) && $m[ mikra_ekey( $email ) ] > time();
}

function mikra_set_abandoning( $email, $until ) {
	$m = get_option( 'mikra_abandoning', array() );
	$m = is_array( $m ) ? $m : array();
	foreach ( $m as $k => $t ) {
		if ( $t < time() ) {
			unset( $m[ $k ] );
		}
	}
	if ( $until > time() ) {
		$m[ mikra_ekey( $email ) ] = $until;
	} else {
		unset( $m[ mikra_ekey( $email ) ] );
	}
	update_option( 'mikra_abandoning', $m, false );
}

/** הסרה לפי כתובת (לקוחות בלי חשבון) */
function mikra_unsub_email_url( $email ) {
	$e = rtrim( strtr( base64_encode( strtolower( trim( $email ) ) ), '+/', '-_' ), '=' );
	return add_query_arg( array( 'mikra_unsub_e' => $e, 't' => mikra_unsub_email_token( $email ) ), home_url( '/' ) );
}

function mikra_unsub_email_token( $email ) {
	return substr( hash_hmac( 'sha256', 'e|' . strtolower( trim( $email ) ), wp_salt( 'auth' ) ), 0, 24 );
}

add_action( 'init', 'mikra_unsubscribe_email', 1 );
function mikra_unsubscribe_email() {
	if ( empty( $_REQUEST['mikra_unsub_e'] ) ) {
		return;
	}
	$raw   = strtr( (string) $_REQUEST['mikra_unsub_e'], '-_', '+/' );
	$email = sanitize_email( (string) base64_decode( $raw . str_repeat( '=', ( 4 - strlen( $raw ) % 4 ) % 4 ) ) );
	$tok   = isset( $_REQUEST['t'] ) ? (string) $_REQUEST['t'] : '';
	if ( $email && hash_equals( mikra_unsub_email_token( $email ), $tok ) ) {
		mikra_suppress( $email );
	}
	if ( 'POST' === strtoupper( (string) ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) ) {
		status_header( 200 );
		exit;
	}
	wp_redirect( MIKRA_SITE . '/unsubscribed', 302, 'Mikra' );
	exit;
}

/* ------------------------------------------------------------------
 * יומן: מה נשלח ומי יצא ולמה. נקרא במסך "מקרא · אוטומציות"
 * ------------------------------------------------------------------ */

/**
 * רשומה ביומן (300 האחרונות, באופציה אחת). $kind: sent | exit | enter
 */
function mikra_log( $kind, $flow, $email, $order_id, $text ) {
	$log = get_option( 'mikra_flow_log', array() );
	$log = is_array( $log ) ? $log : array();
	array_unshift( $log, array( 't' => time(), 'k' => $kind, 'f' => (string) $flow, 'e' => (string) $email, 'o' => (int) $order_id, 'x' => (string) $text ) );
	update_option( 'mikra_flow_log', array_slice( $log, 0, 300 ), false );
}

/** מוחק מיילים מתוזמנים של זרימה, כדי שמי שיצא לא יופיע כ"בזרימה" */
function mikra_unschedule( $flow, $key, $steps ) {
	foreach ( $steps as $st ) {
		wp_clear_scheduled_hook( 'mikra_flow', array( (string) $flow, $key, (int) $st ) );
	}
}

/** יציאה מזרימה: הערה בהזמנה (אם יש), רשומה ביומן, ומחיקת המיילים הבאים */
function mikra_exit( $flow, $email, $order, $why ) {
	$key = 'winback' === $flow ? (string) $email : ( $order ? (int) $order->get_id() : 0 );
	mikra_unschedule( $flow, $key, array( 0, 1, 2, 3, 4 ) );
	$label = array( 'abandon' => 'נטישה', 'post' => 'אחרי הזמנה', 'winback' => 'חזרה' );
	$text  = 'יצא מזרימת ' . ( $label[ $flow ] ?? $flow ) . ': ' . $why;
	if ( $order ) {
		$order->add_order_note( $text );
		$order->save();
	}
	mikra_log( 'exit', $flow, $email, $order ? $order->get_id() : 0, $why );
}

/** למה אין הסכמה: הוסר, או פשוט לא אישר */
function mikra_no_consent_reason( $email ) {
	return mikra_is_suppressed( $email ) ? 'הוסר מרשימת התפוצה' : 'אין הסכמה לדיוור';
}

/* ------------------------------------------------------------------
 * תזמון ומריץ אחד לכל הזרימות
 * ------------------------------------------------------------------ */

function mikra_flow_schedule( $flow, $key, $step, $ts ) {
	$args = array( (string) $flow, $key, (int) $step );
	if ( ! wp_next_scheduled( 'mikra_flow', $args ) ) {
		wp_schedule_single_event( max( time() + 30, mikra_when( $ts ) ), 'mikra_flow', $args );
	}
}

add_action( 'mikra_flow', 'mikra_flow_run', 10, 3 );
function mikra_flow_run( $flow, $key, $step ) {
	if ( 'abandon' === $flow ) {
		mikra_abandon_run( (int) $key, (int) $step );
	} elseif ( 'post' === $flow ) {
		mikra_post_run( (int) $key, (int) $step );
	} elseif ( 'winback' === $flow ) {
		mikra_winback_run( (string) $key, (int) $step );
	}
}

/** דוחה את השלב אם עכשיו אסור. true = נדחה */
function mikra_flow_defer( $flow, $key, $step, $email, $rate = true ) {
	$at = mikra_gate( $email, $rate );
	if ( ! $at ) {
		return false;
	}
	wp_schedule_single_event( $at, 'mikra_flow', array( (string) $flow, $key, (int) $step ) );
	return true;
}

function mikra_paid_statuses() {
	return array( 'wc-processing', 'wc-completed' );
}

/** הזמנות ששולמו בכתובת הזו, חוץ מ-$exclude */
function mikra_paid_orders( $email, $exclude = 0, $limit = 1 ) {
	$args = array( 'customer' => $email, 'status' => mikra_paid_statuses(), 'limit' => $limit, 'orderby' => 'date', 'order' => 'DESC' );
	if ( $exclude ) {
		$args['exclude'] = array( (int) $exclude );
	}
	return wc_get_orders( $args );
}

function mikra_hi( $name ) {
	return $name ? 'שלום ' . esc_html( $name ) . ', ' : 'שלום, ';
}

/* ------------------------------------------------------------------
 * 1. נטישה
 * ------------------------------------------------------------------ */

/** ההזמנה נשמרת (לא מתבטלת) עד סוף הזרימה, כדי שהכפתור במייל יעבוד */
define( 'MIKRA_ABANDON_KEEP_NEW', 5 * DAY_IN_SECONDS );
define( 'MIKRA_ABANDON_KEEP_RETURN', 3 * DAY_IN_SECONDS );

add_action( 'woocommerce_new_order', 'mikra_abandon_start', 20, 2 );
function mikra_abandon_start( $order_id, $order = null ) {
	$order = ( $order instanceof WC_Order ) ? $order : wc_get_order( $order_id );
	if ( ! $order || 'pending' !== $order->get_status() || 'checkout' !== $order->get_created_via() || ! $order->get_billing_email() ) {
		return;
	}
	if ( $order->get_meta( '_mikra_ab_base' ) ) {
		return;
	}
	$email     = $order->get_billing_email();
	$returning = (bool) mikra_paid_orders( $email, $order->get_id() );
	$base      = time();

	// הזמנה קודמת של אותה כתובת שעוד בזרימה - זו החדשה מחליפה אותה
	$older = wc_get_orders( array( 'customer' => $email, 'status' => array( 'wc-pending', 'wc-failed' ), 'exclude' => array( (int) $order->get_id() ), 'limit' => 5 ) );
	foreach ( $older as $o ) {
		if ( $o->get_meta( '_mikra_ab_base' ) && ! $o->get_meta( '_mikra_ab_done' ) ) {
			mikra_abandon_end( $o, 'replaced' );
			$o->update_status( 'cancelled', 'הוחלפה בהזמנה חדשה (#' . $order->get_order_number() . ') של אותו לקוח.' );
		}
	}

	$keep = $returning ? MIKRA_ABANDON_KEEP_RETURN : MIKRA_ABANDON_KEEP_NEW;
	$order->update_meta_data( '_mikra_ab_base', $base );
	$order->update_meta_data( '_mikra_ab_kind', $returning ? 'return' : 'new' );
	$order->update_meta_data( '_mikra_ab_until', $base + $keep );
	$order->save();
	mikra_set_abandoning( $email, $base + $keep );
	mikra_log( 'enter', 'abandon', $email, $order->get_id(), $returning ? 'לקוח חוזר' : 'לקוח חדש' );
	mikra_flow_schedule( 'abandon', (int) $order->get_id(), 1, $base + ( $returning ? 30 : 20 ) * MINUTE_IN_SECONDS );
}

/**
 * שולם: יוצאים מהזרימה מיד (לא בשלב הבא), וגם הזמנות פתוחות אחרות של
 * אותה כתובת שבזרימה - נסגרות, כי הלקוח כבר קנה
 */
add_action( 'woocommerce_order_status_processing', 'mikra_abandon_on_paid', 5, 2 );
add_action( 'woocommerce_order_status_completed', 'mikra_abandon_on_paid', 5, 2 );
function mikra_abandon_on_paid( $order_id, $order = null ) {
	$order = ( $order instanceof WC_Order ) ? $order : wc_get_order( $order_id );
	if ( ! $order || ! $order->get_billing_email() ) {
		return;
	}
	if ( $order->get_meta( '_mikra_ab_base' ) && ! $order->get_meta( '_mikra_ab_done' ) ) {
		mikra_abandon_end( $order, 'paid' );
	}
	$open = wc_get_orders( array( 'customer' => $order->get_billing_email(), 'status' => array( 'wc-pending', 'wc-failed' ), 'exclude' => array( (int) $order->get_id() ), 'limit' => 5 ) );
	foreach ( $open as $o ) {
		if ( $o->get_meta( '_mikra_ab_base' ) && ! $o->get_meta( '_mikra_ab_done' ) ) {
			mikra_abandon_end( $o, 'bought', true );
		}
	}
}

/** ווקומרס מבטל הזמנות שלא שולמו אחרי זמן החזקת המלאי. בזמן הזרימה - לא */
add_filter( 'woocommerce_cancel_unpaid_order', 'mikra_abandon_keep', 10, 2 );
function mikra_abandon_keep( $cancel, $order ) {
	if ( $order instanceof WC_Order ) {
		$until = (int) $order->get_meta( '_mikra_ab_until' );
		if ( $until && time() < $until && ! $order->get_meta( '_mikra_ab_done' ) ) {
			return false;
		}
		// הזמנות מגרסה 1.2 (תזכורת אחת, נשמרות יום)
		$reminded = (int) $order->get_meta( '_mikra_reminded' );
		if ( $reminded && ( time() - $reminded ) < DAY_IN_SECONDS ) {
			return false;
		}
	}
	return $cancel;
}

/** סוף הזרימה: מנקים, ומי שלא שולמה - מתבטלת */
function mikra_abandon_end( $order, $why, $cancel = false ) {
	$text = array(
		'paid'       => 'שילם',
		'bought'     => 'שילם בהזמנה אחרת',
		'cancelled'  => 'הזרימה הסתיימה בלי תשלום',
		'no-consent' => mikra_no_consent_reason( $order->get_billing_email() ),
		'replaced'   => 'פתח הזמנה חדשה במקומה',
	);
	if ( ! $order->get_meta( '_mikra_ab_done' ) ) {
		$order->update_meta_data( '_mikra_ab_done', $why );
		$order->save();
		mikra_exit( 'abandon', $order->get_billing_email(), $order, isset( $text[ $why ] ) ? $text[ $why ] : $why );
		if ( in_array( $why, array( 'paid', 'bought', 'replaced' ), true ) ) {
			mikra_unschedule( 'abandon', (int) $order->get_id(), array( 9 ) );
		}
	}
	mikra_set_abandoning( $order->get_billing_email(), 0 );
	if ( $cancel && in_array( $order->get_status(), array( 'pending', 'failed' ), true ) ) {
		$order->update_status( 'cancelled', 'cancelled' === $why ? 'לא שולמה עד סוף זרימת התזכורות.' : 'הלקוח שילם בהזמנה אחרת.' );
	}
}

function mikra_abandon_run( $order_id, $step ) {
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}
	if ( $order->get_meta( '_mikra_ab_done' ) ) {
		// הזרימה נגמרה. נשאר רק לבטל הזמנה של תזכורת שירות שלא שולמה
		if ( 9 === $step && 'no-consent' === $order->get_meta( '_mikra_ab_done' ) && in_array( $order->get_status(), array( 'pending', 'failed' ), true ) ) {
			$order->update_status( 'cancelled', 'לא שולמה יום אחרי התזכורת.' );
		}
		return;
	}
	$email = $order->get_billing_email();
	if ( ! in_array( $order->get_status(), array( 'pending', 'failed' ), true ) ) {
		mikra_abandon_end( $order, 'paid' );
		return;
	}
	$base = (int) $order->get_meta( '_mikra_ab_base' );
	$kind = (string) $order->get_meta( '_mikra_ab_kind' );

	// קנה בינתיים בהזמנה אחרת
	$paid = mikra_paid_orders( $email, $order_id );
	if ( $paid && $paid[0]->get_date_created() && $paid[0]->get_date_created()->getTimestamp() > $base ) {
		mikra_abandon_end( $order, 'bought', true );
		return;
	}
	if ( 9 === $step ) {
		mikra_abandon_end( $order, 'cancelled', true );
		return;
	}
	if ( $order->get_meta( '_mikra_ab_sent_' . $step ) ) {
		return;
	}

	$consent = mikra_consent( $email );
	if ( ! $consent && 1 !== $step ) {
		mikra_abandon_end( $order, 'no-consent', false );
		mikra_flow_schedule( 'abandon', $order_id, 9, (int) $order->get_meta( '_mikra_ab_until' ) );
		return;
	}
	// התזכורת הראשונה לא מחכה למייל אחר באותו יום
	if ( mikra_flow_defer( 'abandon', $order_id, $step, $email, 1 !== $step ) ) {
		return;
	}

	if ( 2 === $step && 'new' === $kind ) {
		mikra_abandon_coupon( $order );
	}
	$unsub = $consent ? mikra_unsub_email_url( $email ) : '';
	$mail  = mikra_abandon_email( $step, $order, $unsub, ! $consent );
	if ( $mail && mikra_send_html( $email, $mail[0], $mail[1], $unsub ) ) {
		$order->update_meta_data( '_mikra_ab_sent_' . $step, time() );
		$order->add_order_note( 'נשלח מייל נטישה: ' . $mail[0] );
		$order->save();
		if ( $consent ) {
			mikra_mark_sent( $email );
		}
	}

	if ( ! $consent ) {
		// בלי הסכמה: תזכורת שירות אחת, וההזמנה נשמרת יום כמו פעם
		$order->update_meta_data( '_mikra_ab_until', $base + DAY_IN_SECONDS );
		$order->update_meta_data( '_mikra_ab_done', 'no-consent' );
		$order->save();
		mikra_exit( 'abandon', $email, $order, mikra_no_consent_reason( $email ) . ' - קיבל רק תזכורת שירות אחת' );
		mikra_set_abandoning( $email, 0 );
		mikra_flow_schedule( 'abandon', $order_id, 9, $base + DAY_IN_SECONDS );
		return;
	}
	$plan = 'new' === $kind
		? array( 1 => array( 3, mikra_day_at( $base, 1, '10:00' ) ), 3 => array( 2, mikra_day_at( $base, 2, '10:00' ) ), 2 => array( 4, mikra_day_at( $base, 3, '19:30' ) ), 4 => array( 9, $base + MIKRA_ABANDON_KEEP_NEW ) )
		: array( 1 => array( 4, mikra_day_at( $base, 2, '19:30' ) ), 4 => array( 9, $base + MIKRA_ABANDON_KEEP_RETURN ) );
	if ( isset( $plan[ $step ] ) ) {
		list( $next, $at ) = $plan[ $step ];
		if ( 9 === $next ) {
			// הביטול אינו מייל - לא צריך חלון שליחה
			wp_schedule_single_event( max( $at, time() + 60 ), 'mikra_flow', array( 'abandon', $order_id, 9 ) );
		} else {
			mikra_flow_schedule( 'abandon', $order_id, $next, $at );
		}
	}
}

/**
 * ההנחה של מייל הקוד. אם ללקוח יש עדיין את קוד ההצטרפות (MIKRA20) ולא
 * השתמש בו - מזכירים אותו, ולא מייצרים קוד נוסף. אחרת: קוד אישי של 10%,
 * לשימוש אחד, רק לכתובת שלו, עד סוף הזרימה. לא כשכבר יש קופון על ההזמנה.
 */
function mikra_abandon_coupon( $order ) {
	if ( $order->get_meta( '_mikra_ab_code' ) || $order->get_coupon_codes() ) {
		return;
	}
	$email = $order->get_billing_email();
	$until = (int) $order->get_meta( '_mikra_ab_until' );
	$promo = mikra_promo();
	if ( $promo && mikra_promo_unused( $email ) ) {
		$order->update_meta_data( '_mikra_ab_code', $promo['code'] );
		$order->update_meta_data( '_mikra_ab_pct', (int) $promo['percent'] );
		$order->update_meta_data( '_mikra_ab_exp', $promo['expires'] ? min( (int) $promo['expires'], $until ) : $until );
		$order->update_meta_data( '_mikra_ab_promo', 1 );
		$order->save();
		return;
	}
	$code = mikra_make_coupon( 'BRACHA', 10, $until, $email, 'נטישה · הזמנה #' . $order->get_order_number() );
	if ( $code ) {
		$order->update_meta_data( '_mikra_ab_code', $code );
		$order->update_meta_data( '_mikra_ab_pct', 10 );
		$order->update_meta_data( '_mikra_ab_exp', $until );
		$order->save();
	}
}

/** נרשם בפופאפ ועוד לא השתמש בקוד ההצטרפות */
function mikra_promo_unused( $email ) {
	$user = get_user_by( 'email', $email );
	if ( ! $user || 'פופאפ מועדון' !== (string) get_user_meta( $user->ID, 'מקור', true ) || ! class_exists( 'WC_Coupon' ) ) {
		return false;
	}
	$c = new WC_Coupon( MIKRA_PROMO_COUPON );
	if ( ! $c->get_id() ) {
		return false;
	}
	$used = array_map( 'strtolower', array_map( 'strval', (array) $c->get_used_by() ) );
	return ! in_array( strtolower( $email ), $used, true ) && ! in_array( (string) $user->ID, $used, true );
}

/** קופון אישי שפג ב-$expires (חותמת זמן) */
function mikra_make_coupon( $prefix, $percent, $expires, $email, $note ) {
	if ( ! class_exists( 'WC_Coupon' ) ) {
		return '';
	}
	$chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	$tail  = '';
	for ( $i = 0; $i < 5; $i++ ) {
		$tail .= $chars[ random_int( 0, strlen( $chars ) - 1 ) ];
	}
	$code = $prefix . '-' . $tail;
	$c    = new WC_Coupon();
	$c->set_code( strtolower( $code ) );
	$c->set_discount_type( 'percent' );
	$c->set_amount( $percent );
	$c->set_individual_use( true );
	$c->set_usage_limit( 1 );
	$c->set_usage_limit_per_user( 1 );
	$c->set_email_restrictions( array( $email ) );
	$c->set_date_expires( (int) $expires );
	$c->set_description( $note . ' · נוצר אוטומטית בתוסף mikra-store' );
	$c->save();
	return $c->get_id() ? $code : '';
}

/** הכפתור במייל: מכניס את הקוד להזמנה ושולח לעמוד התשלום */
function mikra_apply_url( $order ) {
	return add_query_arg( array( 'mikra_apply' => (int) $order->get_id(), 'k' => $order->get_order_key() ), home_url( '/' ) );
}

add_action( 'init', 'mikra_apply_discount', 1 );
function mikra_apply_discount() {
	if ( empty( $_GET['mikra_apply'] ) ) {
		return;
	}
	$order = wc_get_order( (int) $_GET['mikra_apply'] );
	$key   = isset( $_GET['k'] ) ? (string) $_GET['k'] : '';
	if ( ! $order || ! hash_equals( (string) $order->get_order_key(), $key ) ) {
		wp_redirect( MIKRA_SITE . '/', 302, 'Mikra' );
		exit;
	}
	$code = (string) $order->get_meta( '_mikra_ab_code' );
	if ( $code && in_array( $order->get_status(), array( 'pending', 'failed' ), true ) && ! in_array( strtolower( $code ), array_map( 'strtolower', $order->get_coupon_codes() ), true ) ) {
		$r = $order->apply_coupon( strtolower( $code ) );
		if ( is_wp_error( $r ) ) {
			$order->add_order_note( 'הקוד ' . $code . ' לא נכנס: ' . $r->get_error_message() );
		} else {
			$order->add_order_note( 'הלקוח לחץ במייל, והקוד ' . $code . ' נכנס להזמנה.' );
		}
		$order->save();
	}
	wp_redirect( mikra_store_pay_url( $order ), 302, 'Mikra' );
	exit;
}

/** "יום ראשון 18.10" */
function mikra_he_day( $ts ) {
	$days = array( 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת' );
	$d    = ( new DateTime( '@' . (int) $ts ) )->setTimezone( mikra_tz() );
	return 'יום ' . $days[ (int) $d->format( 'w' ) ] . ' ' . $d->format( 'j.n' );
}

/**
 * [נושא, html]. $service = מייל שירות (אין הסכמה): עובדתי בלבד - בלי
 * "פרסומת", בלי הסרה, בלי הנחה ובלי שכנוע. רק שההזמנה שמורה ואיך משלמים.
 *
 * סדר המיילים ללקוח חדש (המספרים הם מזהי התוכן, לא הסדר):
 * 1 תזכורת · 3 הוכחה (בלי הנחה) · 2 הקוד · 4 מכתב
 */
function mikra_abandon_email( $step, $order, $unsub, $service = false ) {
	$hi    = mikra_hi( $order->get_billing_first_name() );
	$name  = esc_html( $order->get_billing_first_name() );
	$pay   = mikra_store_pay_url( $order );
	$code  = (string) $order->get_meta( '_mikra_ab_code' );
	$pct   = (int) $order->get_meta( '_mikra_ab_pct' ) ? (int) $order->get_meta( '_mikra_ab_pct' ) : 10;
	$exp   = (int) $order->get_meta( '_mikra_ab_exp' );
	$promo = (bool) $order->get_meta( '_mikra_ab_promo' );
	$until = $exp ? 'בתוקף עד ' . mikra_he_day( $exp ) : '';
	$go    = $code ? mikra_apply_url( $order ) : $pay;
	$kind  = (string) $order->get_meta( '_mikra_ab_kind' );
	$wa    = '<a href="' . esc_url( mikra_store_wa_url( $order ) ) . '" style="color:#96661c;font-weight:500;">בוואטסאפ <span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span></a>';
	$foot  = mk_footer( $unsub, 'כי אישרת דיוור', 'קיבלת את המייל כי התחלת הזמנה באתר, הזמנה #' . $order->get_order_number() . '.' );
	$pct_h = '<span dir="ltr">' . $pct . '%</span>';

	switch ( (int) $step ) {
		case 1:
			if ( $service ) {
				$keep    = (int) $order->get_meta( '_mikra_ab_until' );
				$rows    = mk_topbar( 'הזמנה #' . $order->get_order_number() )
					. mk_heading( '', 'ההזמנה שלך', 'ממתינה לתשלום.', $hi . 'ההזמנה עוד לא שולמה, והיא שמורה' . ( $keep ? ' עד ' . esc_html( mikra_he_day( $keep ) ) : '' ) . '. אם כבר שילמת - אפשר להתעלם מהמייל הזה.', 40 )
					. mk_cart( $order, 'פרטי ההזמנה' )
					. mk_button( 'לתשלום', $pay );
				$subject = 'ההזמנה שלך במִקְרָא ממתינה לתשלום';
				$pre     = 'הזמנה #' . $order->get_order_number() . ' עוד לא שולמה.';
				break;
			}
			$rows    = mk_photo_hero( 'hero-abandon-1.jpg', '', 'נשאר רק צעד אחד', 'התכשיט והברכה שבחרת שמורים לך, בדיוק כמו שהשארת.', 'להשלמת ההזמנה', $pay )
				. mk_cart( $order )
				. mk_button( 'להשלמת ההזמנה', $pay )
				. mk_para( $hi . 'ראינו שהגעת עד התשלום ולא סיימת. זה קורה - אולי קפצה שיחה, אולי רצית לחשוב עוד רגע.', '36px 44px 0' )
				. mk_note( 'שאלה לפני שמזמינים?', 'על הברכה, המידה או המשלוח - כותבים לנו ' . $wa . ', או עונים למייל הזה. עונים אנשים, לא בוט.' );
			$subject = 'פרסומת: נשאר רק צעד אחד - הברכה שלך מחכה';
			$pre     = 'return' === $kind ? 'נשאר רק לאשר את התשלום.' : 'התכשיט והברכה שבחרת שמורים לך.';
			break;

		case 3:
			$rows    = mk_photo_hero( 'hero-abandon-3.jpg', '', 'עדיין מתלבטים?<br>הנה מה שתקבלו.', 'צילום אמיתי של השבב, ואיך התכשיט נעשה.', 'להשלמת ההזמנה', $go )
				. mk_lens_block( 'צילום אמיתי, במיקרוסקופ', 'כל מילה בברכה,<br>על שבב של <span dir="ltr">5</span> מ״מ.', 'כל אות בגובה של כחצי עובי שערה. חורטים את השבב לפי ההזמנה, ובודקים אות אחרי אות מול המקור.' )
				. mk_sq3( 'מה שמגיע אליך' )
				. mk_fact_boxes( array( array( 'עד 5', 'תשלומים' ), array( '2-4', 'ימי עסקים, מבוטח' ), array( '30 יום', 'להחזרה' ) ) )
				. mk_cart( $order, 'מה שמחכה לך' )
				. mk_button( 'להשלמת ההזמנה', $go );
			$subject = 'פרסומת: ככה נראית ברכה על שבב של 5 מ״מ';
			$pre     = 'צילום אמיתי מהמיקרוסקופ, לפני שמחליטים.';
			break;

		case 2:
			if ( $code ) {
				$sub  = $promo ? 'קוד ההצטרפות שלך עוד לא נוצל. הוא נכנס להזמנה בלחיצה אחת.' : 'רצינו לתת לך סיבה טובה לסיים. ההנחה נכנסת להזמנה בלחיצה אחת.';
				$rows = mk_photo_hero( 'hero-abandon-2.jpg', '', $pct_h . ' על ההזמנה<br>שכמעט סיימת', $sub, 'להשלמת ההזמנה עם ההנחה', $go )
					. mk_ticket( array( 'code' => $code, 'percent' => $pct ), $promo ? 'קוד ההצטרפות שלך' : 'הקוד שלך', 'נכנס להזמנה בלחיצה על הכפתור' . ( $until ? ' · ' . $until : '' ), 'על ההזמנה' )
					. mk_cart( $order )
					. mk_button( 'להשלמת ההזמנה עם ההנחה', $go );
				$subject = 'פרסומת: ההזמנה שלך, עם ' . $pct . '% הנחה';
				$pre     = 'ההנחה נכנסת בלחיצה אחת' . ( $until ? ', ' . $until : '' ) . '.';
			} else {
				// כבר יש הנחה על ההזמנה (קוד ההצטרפות) - לא מוסיפים עוד
				$rows    = mk_photo_hero( 'hero-abandon-2.jpg', '', 'ההנחה שלך<br>כבר על ההזמנה', 'הקוד שהזנת שמור בהזמנה. נשאר רק לשלם.', 'להשלמת ההזמנה', $pay )
					. mk_para( $hi . 'אפשר לשלם בכרטיס אשראי, bit, Apple Pay או Google Pay, עד 5 תשלומים.', '36px 44px 0' )
					. mk_cart( $order )
					. mk_button( 'להשלמת ההזמנה', $pay );
				$subject = 'פרסומת: ההזמנה שלך, עם ההנחה, עדיין שמורה';
				$pre     = 'נשאר רק לשלם.';
			}
			break;

		case 4:
			// מכתב קצר, קישור אחד בתוך הטקסט, ושאלה אחת בסוף
			$link = '<a href="' . esc_url( $go ) . '" style="color:#96661c;text-decoration:underline;">ההזמנה שמורה כאן</a>';
			$wa_t = 'בוואטסאפ <span dir="ltr">' . esc_html( MIKRA_PHONE ) . '</span>';
			if ( 'return' === $kind ) {
				$subject = 'פרסומת: תודה, ומילה אחרונה מאיתנו';
				$first   = 'ראיתי שחזרת אלינו, ושההזמנה נעצרה רגע לפני התשלום. קודם כל - תודה. זה לא מובן מאליו שחוזרים.';
				$paras   = array(
					$name ? 'היי ' . $name . ',' : 'היי,',
					'זה עמית ממִקְרָא. ' . $first,
					'אם משהו בתשלום לא עבד, אפשר לענות כאן או לכתוב לי ' . $wa_t . ', ואני מטפל בזה. ' . $link . ', למתי שנוח.',
					'היה משהו שהפריע?',
					'עמית<br>מִקְרָא',
				);
			} else {
				$subject = 'פרסומת: רציתי לוודא שהכל בסדר';
				$first   = 'ראיתי שהתחלת הזמנה ונעצרת בתשלום. רציתי רק לוודא שהכל בסדר.';
				$paras   = array(
					$name ? 'היי ' . $name . ',' : 'היי,',
					'זה עמית ממִקְרָא. ' . $first,
					'לפעמים זו תקלה בתשלום, לפעמים שאלה על הברכה או על המידה. אפשר לענות כאן, או לכתוב לי ' . $wa_t . '. ' . $link . ', למתי שנוח.',
					'ושאלה אחת, אם בא לך: מה עצר אותך? גם מילה אחת עוזרת לי.',
					'עמית<br>מִקְרָא',
				);
			}
			return array( $subject, mk_letter( $subject, $first, $paras, $unsub ) );

		default:
			return null;
	}
	return array( $subject, mk_wrap( $subject, $pre, $rows . $foot ) );
}

/* ------------------------------------------------------------------
 * 2. אחרי הזמנה
 * ------------------------------------------------------------------ */

/** לקוח חוזר: מכתב תודה יום אחרי התשלום */
add_action( 'woocommerce_order_status_processing', 'mikra_post_paid', 20, 2 );
function mikra_post_paid( $order_id, $order = null ) {
	$order = ( $order instanceof WC_Order ) ? $order : wc_get_order( $order_id );
	if ( ! $order || $order->get_meta( '_mikra_pp_paid' ) || ! $order->get_billing_email() ) {
		return;
	}
	$order->update_meta_data( '_mikra_pp_paid', time() );
	$order->save();
	if ( mikra_paid_orders( $order->get_billing_email(), $order->get_id() ) ) {
		mikra_flow_schedule( 'post', (int) $order->get_id(), 0, mikra_day_at( time(), 1, '19:30' ) );
	}
}

/** נשלח (הושלמה): שלושת המיילים, לפי הימים מהמשלוח */
add_action( 'woocommerce_order_status_completed', 'mikra_post_shipped', 20, 2 );
function mikra_post_shipped( $order_id, $order = null ) {
	$order = ( $order instanceof WC_Order ) ? $order : wc_get_order( $order_id );
	if ( ! $order || $order->get_meta( '_mikra_pp_shipped' ) || ! $order->get_billing_email() ) {
		return;
	}
	$t = time();
	$order->update_meta_data( '_mikra_pp_shipped', $t );
	$order->save();
	if ( mikra_consent( $order->get_billing_email() ) ) {
		mikra_log( 'enter', 'post', $order->get_billing_email(), $order->get_id(), 'ההזמנה נשלחה' );
	}
	mikra_flow_schedule( 'post', (int) $order->get_id(), 1, mikra_day_at( $t, 4, '10:00' ) );
}

function mikra_post_run( $order_id, $step ) {
	$order = wc_get_order( $order_id );
	if ( ! $order || $order->get_meta( '_mikra_pp_sent_' . $step ) ) {
		return;
	}
	$email = $order->get_billing_email();
	if ( $order->get_meta( '_mikra_pp_done' ) ) {
		return;
	}
	$stop = function ( $why ) use ( $order, $email ) {
		$order->update_meta_data( '_mikra_pp_done', $why );
		$order->save();
		mikra_exit( 'post', $email, $order, $why );
	};
	if ( ! in_array( $order->get_status(), array( 'processing', 'completed' ), true ) || (float) $order->get_total_refunded() > 0 ) {
		$stop( 'ההזמנה בוטלה או הוחזרה' );
		return;
	}
	// הזמנה חדשה יותר שנשלחה - הזרימה שלה ממשיכה, לא זו
	if ( $step > 0 ) {
		$newer = wc_get_orders( array( 'customer' => $email, 'status' => array( 'wc-completed' ), 'limit' => 1, 'orderby' => 'date', 'order' => 'DESC' ) );
		if ( $newer && (int) $newer[0]->get_id() !== (int) $order_id ) {
			$stop( 'הזמנה חדשה יותר (#' . $newer[0]->get_order_number() . ') ממשיכה במקומה' );
			return;
		}
	}
	if ( ! mikra_consent( $email ) ) {
		$stop( mikra_no_consent_reason( $email ) );
		return;
	}
	if ( mikra_flow_defer( 'post', $order_id, $step, $email ) ) {
		return;
	}
	$unsub = mikra_unsub_email_url( $email );
	$mail  = mikra_post_email( $step, $order, $unsub );
	if ( $mail && mikra_send_html( $email, $mail[0], $mail[1], $unsub ) ) {
		$order->update_meta_data( '_mikra_pp_sent_' . $step, time() );
		$order->add_order_note( 'נשלח מייל אחרי הזמנה: ' . $mail[0] );
		$order->save();
		mikra_mark_sent( $email );
	}
	$shipped = (int) $order->get_meta( '_mikra_pp_shipped' );
	$plan    = array( 1 => array( 2, 10, '10:00' ), 2 => array( 3, 14, '19:30' ) );
	if ( $shipped && isset( $plan[ $step ] ) ) {
		mikra_flow_schedule( 'post', $order_id, $plan[ $step ][0], mikra_day_at( $shipped, $plan[ $step ][1], $plan[ $step ][2] ) );
	} elseif ( 3 === $step ) {
		$stop( 'סיים את כל המיילים' );
	}
}

/** הברכה שבחרו בהזמנה (המזהה היציב), לקישור "לקריאת הברכה" */
function mikra_order_blessing( $order ) {
	foreach ( $order->get_items() as $item ) {
		$id = (string) $item->get_meta( '_mikra_blessing_id', true );
		if ( '' !== $id ) {
			return $id;
		}
	}
	return '';
}

function mikra_review_url( $order, $stars = 0 ) {
	if ( MIKRA_REVIEW_URL ) {
		return MIKRA_REVIEW_URL;
	}
	$s = 'ביקורת על הזמנה #' . $order->get_order_number() . ( $stars ? ' · ' . $stars . ' כוכבים' : '' );
	return 'mailto:' . MIKRA_EMAIL . '?subject=' . rawurlencode( $s );
}

function mikra_post_email( $step, $order, $unsub ) {
	$hi   = mikra_hi( $order->get_billing_first_name() );
	$camp = 'post-' . $step;
	$foot = mk_footer( $unsub, 'כי אישרת דיוור' );
	switch ( (int) $step ) {
		case 0:
			$name    = esc_html( $order->get_billing_first_name() );
			$subject = 'פרסומת: תודה שחזרת';
			$first   = 'ראיתי שהזמנת אצלנו שוב, ורציתי פשוט להגיד תודה. זה לא מובן מאליו שחוזרים.';
			$paras   = array(
				$name ? 'היי ' . $name . ',' : 'היי,',
				'זה עמית ממִקְרָא. ' . $first,
				'ההזמנה כבר בטיפול: חורטים את הברכה, בודקים אות אחרי אות, ושולחים. צריך לשנות משהו? עונים למייל הזה, ואני מטפל.',
				'ושאלה קטנה: למי התכשיט הפעם, ולאיזה רגע?',
				'עמית<br>מִקְרָא',
			);
			return array( $subject, mk_letter( $subject, $first, $paras, $unsub ) );

		case 1:
			$bid     = mikra_order_blessing( $order );
			$read    = mikra_utm( $bid ? '/blessings/' . $bid : '/blessings', $camp );
			$rows    = mk_topbar( 'אחרי ההזמנה · מכתב 1' )
				. mk_image( 'pp-care.jpg', 'שרשרת של מקרא, מוחזקת בין שתי אצבעות' )
				. mk_heading( 'לפני שעונדים', 'ככה שומרים', 'על הברכה.', $hi . 'התכשיט הגיע, או שהוא ממש בדרך. ארבעה דברים קטנים, והוא יישאר יפה הרבה שנים.', 46 )
				. mk_care()
				. mk_feature_row( 'chip-macro.jpg', 'מה כתוב על השבב', 'כרטיס הברכה', 'בקופסה יש כרטיס עם הברכה המלאה ומאיפה היא לקוחה. שמרו אותו ליד התכשיט.', 'לקריאת הברכה באתר', $read )
				. mk_button( 'לקריאת הברכה שלך', $read )
				. mk_signoff( 'יש שאלה על התכשיט? עונים למייל הזה, ואנחנו כאן.' );
			$subject = 'פרסומת: לפני שעונדים בפעם הראשונה';
			$pre     = 'ארבעה דברים קטנים, והתכשיט יישאר יפה הרבה שנים.';
			break;

		case 2:
			// שלוש ברכות, בלי התכשיט שכבר קנו
			$bought = array();
			foreach ( $order->get_items() as $item ) {
				$p = is_callable( array( $item, 'get_product' ) ) ? $item->get_product() : null;
				if ( $p ) {
					$bought[] = (string) $p->get_sku();
				}
			}
			$ids = array();
			foreach ( mikra_blessing_picks() as $id => $b ) {
				if ( ! in_array( $b[4], $bought, true ) && count( $ids ) < 3 ) {
					$ids[] = $id;
				}
			}
			$rows    = mk_topbar( 'לרגע הבא · מכתב 2' )
				. mk_heading( 'מתנה עם משמעות', 'יש עוד מישהו', 'שמגיעה לו ברכה?', $hi . 'כשיש אירוע - לידה, חתונה, יום הולדת - ברכה היא מתנה שנשארת. ככה בוחרים: מתחילים ממי שמקבל.', 46 )
				. mk_blessing_rows( $ids, $camp )
				. mk_button( 'לכל התכשיטים', mikra_utm( '/catalog', $camp ), '36px 40px 0' )
				. mk_signoff( 'מתלבטים? עונים למייל הזה וכותבים למי ולאיזה רגע. נציע ברכה ותכשיט.' );
			$subject = 'פרסומת: יש עוד מישהו שמגיעה לו ברכה?';
			$pre     = 'לידה, חתונה, יום הולדת - ברכה שנשארת.';
			break;

		case 3:
			$rows    = mk_topbar( 'איך התכשיט · מכתב 3' )
				. mk_image( 'pp-review.jpg', 'זוג עונד תכשיטים של מקרא' )
				. mk_heading( 'עבר שבועיים מאז שהגיע', 'איך התכשיט?', 'ספרו לנו בכנות.', $hi . 'אנחנו עסק חדש, ועוד אין לנו הרבה ביקורות. שתי דקות שלכם יעזרו למישהו אחר להחליט. אם נתתם במתנה - איך הגיבו?', 46 )
				. mk_rating( function ( $n ) use ( $order ) {
					return mikra_review_url( $order, $n );
				} )
				. mk_note( 'יש תמונה של התכשיט?', 'נשמח לראות. שולחים בתשובה למייל הזה, וכותבים "מותר" אם אפשר להראות אותה באתר.' )
				. mk_note( 'ואם משהו לא היה בסדר', 'ספרו לנו קודם, בתשובה למייל הזה. נסדר את זה.', '14px 36px 0' )
				. mk_button( 'לכתיבת ביקורת', mikra_review_url( $order ) )
				. mk_signoff( 'תודה שבחרת בנו.' );
			$subject = 'פרסומת: איך התכשיט? נשמח לשמוע';
			$pre     = 'נשמח לשמוע, בכנות.';
			break;

		default:
			return null;
	}
	return array( $subject, mk_wrap( $subject, $pre, $rows . $foot ) );
}

/* ------------------------------------------------------------------
 * 3. חזרה: X ימים בלי קנייה
 * ------------------------------------------------------------------ */

add_action( 'init', 'mikra_winback_cron' );
function mikra_winback_cron() {
	if ( ! wp_next_scheduled( 'mikra_winback_scan' ) ) {
		wp_schedule_event( mikra_day_at( time(), 1, '09:30' ), 'daily', 'mikra_winback_scan' );
	}
}

/** פעם ביום: מי שהקנייה האחרונה שלו הייתה לפני X ימים בדיוק */
add_action( 'mikra_winback_scan', 'mikra_winback_scan' );
function mikra_winback_scan() {
	$to     = time() - MIKRA_WINBACK_DAYS * DAY_IN_SECONDS;
	$from   = $to - DAY_IN_SECONDS;
	$orders = wc_get_orders( array( 'status' => mikra_paid_statuses(), 'date_created' => $from . '...' . $to, 'limit' => 300 ) );
	$state  = get_option( 'mikra_winback', array() );
	$state  = is_array( $state ) ? $state : array();
	foreach ( $orders as $o ) {
		$email = (string) $o->get_billing_email();
		$k     = mikra_ekey( $email );
		if ( ! $email || ( isset( $state[ $k ] ) && time() - (int) $state[ $k ]['t'] < MIKRA_WINBACK_REPEAT ) ) {
			continue;
		}
		$last = mikra_paid_orders( $email );
		if ( ! $last || (int) $last[0]->get_id() !== (int) $o->get_id() || ! mikra_consent( $email ) ) {
			continue; // קנה מאז, או בלי הסכמה
		}
		$state[ $k ] = array( 't' => time(), 'name' => (string) $o->get_billing_first_name(), 'sent' => array(), 'e' => $email );
		mikra_log( 'enter', 'winback', $email, $o->get_id(), MIKRA_WINBACK_DAYS . ' ימים בלי קנייה' );
		mikra_flow_schedule( 'winback', $email, 1, mikra_day_at( time(), 0, '10:00' ) );
	}
	update_option( 'mikra_winback', $state, false );
}

function mikra_winback_run( $email, $step ) {
	$state = get_option( 'mikra_winback', array() );
	$k     = mikra_ekey( $email );
	if ( ! is_array( $state ) || empty( $state[ $k ] ) || ! empty( $state[ $k ]['sent'][ $step ] ) ) {
		return;
	}
	$entry = (int) $state[ $k ]['t'];
	if ( ! empty( $state[ $k ]['done'] ) ) {
		return;
	}
	$stop = function ( $why ) use ( &$state, $k, $email ) {
		$state[ $k ]['done'] = $why;
		update_option( 'mikra_winback', $state, false );
		mikra_exit( 'winback', $email, null, $why );
	};
	$last = mikra_paid_orders( $email );
	if ( $last && $last[0]->get_date_created() && $last[0]->get_date_created()->getTimestamp() > $entry ) {
		$stop( 'חזר וקנה (#' . $last[0]->get_order_number() . ')' );
		return;
	}
	if ( ! mikra_consent( $email ) ) {
		$stop( mikra_no_consent_reason( $email ) );
		return;
	}
	if ( mikra_flow_defer( 'winback', $email, $step, $email ) ) {
		return;
	}
	if ( 2 === $step && empty( $state[ $k ]['code'] ) ) {
		$state[ $k ]['code'] = mikra_make_coupon( 'BACK10', 10, time() + 7 * DAY_IN_SECONDS, $email, 'חזרה' );
	}
	$unsub = mikra_unsub_email_url( $email );
	$mail  = mikra_winback_email( $step, (string) $state[ $k ]['name'], $unsub, (string) ( $state[ $k ]['code'] ?? '' ) );
	if ( $mail && mikra_send_html( $email, $mail[0], $mail[1], $unsub ) ) {
		$state[ $k ]['sent'][ $step ] = time();
		mikra_mark_sent( $email );
	}
	update_option( 'mikra_winback', $state, false );

	$next = array();
	if ( MIKRA_WINBACK_COUPONS ) {
		$next[1] = array( 2, 5, '10:00' );
		$next[2] = array( 3, 11, '19:30' );
	}
	if ( MIKRA_FOUNDER_STORY ) {
		$next[ MIKRA_WINBACK_COUPONS ? 3 : 1 ] = array( 4, 20, '19:30' );
	}
	if ( isset( $next[ $step ] ) ) {
		mikra_flow_schedule( 'winback', $email, $next[ $step ][0], mikra_day_at( $entry, $next[ $step ][1], $next[ $step ][2] ) );
	} else {
		$stop( 'סיים את כל המיילים' );
	}
}

function mikra_winback_email( $step, $name, $unsub, $code = '' ) {
	$hi   = mikra_hi( $name );
	$camp = 'winback-' . $step;
	$foot = mk_footer( $unsub, 'כי אישרת דיוור' );
	switch ( (int) $step ) {
		case 1:
			$rows    = mk_photo_hero( 'hero-winback-1.jpg', 'עבר קצת זמן', 'מה חדש אצלך?', 'מקווים שהתכשיט עדיין עליך, והברכה איתך.' )
				. mk_para( $hi . 'עברו כמה חודשים מאז שהזמנת אצלנו. אם יש אירוע בדרך - לידה, חתונה, יום הולדת - אנחנו כאן בשביל הברכה הבאה.', '40px 44px 0' )
				. mk_subhead( 'לרגעים שבדרך' )
				. mk_blessing_rows( array( 'eshet-chayil', 'shmira', 'parnasa' ), $camp )
				. mk_button( 'לכל התכשיטים', mikra_utm( '/catalog', $camp ), '36px 40px 0' )
				. mk_signoff( 'רוצים עזרה לבחור? עונים למייל הזה וכותבים למי ולאיזה רגע.' );
			$subject = 'פרסומת: עבר קצת זמן. מה חדש אצלך?';
			$pre     = 'אנחנו כאן בשביל הברכה הבאה.';
			break;

		case 2:
			if ( ! $code ) {
				return null;
			}
			$rows    = mk_photo_hero( 'hero-winback-2.jpg', 'כי כבר בחרת בנו פעם', 'משהו קטן<br>לברכה הבאה', '', 'לבחירת תכשיט', mikra_utm( '/catalog', $camp ) )
				. mk_para( $hi . 'לקוחות שחוזרים הם הכי יקרים לנו. אז הכנו לך הטבה אישית, לשבוע אחד:', '40px 44px 0' )
				. mk_ticket( array( 'code' => $code, 'percent' => 10 ), 'הקוד האישי שלך', 'מקלידים בקופה · בתוקף 7 ימים' )
				. mk_gallery4( $camp )
				. mk_button( 'לבחירת תכשיט', mikra_utm( '/catalog', $camp ) )
				. mk_signoff( 'מתלבטים מה לבחור? עונים למייל הזה, ונעזור.' );
			$subject = 'פרסומת: משהו קטן בשבילך, לברכה הבאה';
			$pre     = '10% אישי, לשבוע אחד.';
			break;

		case 3:
			if ( ! $code ) {
				return null;
			}
			$rows    = mk_topbar( 'תזכורת אחרונה' )
				. mk_heading( 'תזכורת אחרונה', 'ההטבה שלך', 'נגמרת מחר.', $hi . 'רק תזכורת קטנה: הקוד שלך תקף עד מחר בלילה. אחרי זה הוא נסגר.', 46 )
				. mk_ticket( array( 'code' => $code, 'percent' => 10 ), 'בתוקף עד מחר', 'מקלידים בקופה · עד 23:59' )
				. '<tr><td style="padding-top:30px;"></td></tr>'
				. mk_quote_band( 'אחת הברכות שלנו', 'יְבָרֶכְךָ ה׳<br>וְיִשְׁמְרֶךָ', 'ברכת כוהנים · במדבר ו׳, כ״ד' )
				. mk_trust()
				. mk_button( 'להשתמש בקוד', mikra_utm( '/catalog', $camp ) );
			$subject = 'פרסומת: מחר זה נגמר';
			$pre     = 'הקוד האישי שלך תקף עד מחר בלילה.';
			break;

		case 4:
			if ( ! MIKRA_FOUNDER_STORY ) {
				return null;
			}
			$subject = 'פרסומת: שאלה קטנה ממני';
			$paras   = array(
				$name ? 'היי ' . esc_html( $name ) . ',' : 'היי,',
				'זה עמית, ממִקְרָא. אני כותב לך בעצמי.',
				esc_html( MIKRA_FOUNDER_STORY ),
				'רציתי לשאול: איך התכשיט אחרי כמה חודשים? הוא עדיין עליך? יש משהו שהיה יכול להיות טוב יותר?',
				'אני קורא כל תשובה בעצמי. גם אם זו שורה אחת.',
				'תודה,<br>עמית<br>מִקְרָא',
			);
			return array( $subject, mk_letter( $subject, 'אני כותב לך בעצמי.', $paras, $unsub ) );

		default:
			return null;
	}
	return array( $subject, mk_wrap( $subject, $pre, $rows . $foot ) );
}

/* ------------------------------------------------------------------
 * בדיקה: שולח מייל מאחת הזרימות לכתובת שנבחרה, מיד
 * POST /wp-json/wc/mikra/flow-test
 * { email, flow: abandon|post|winback, step, order_id, name }
 * ------------------------------------------------------------------ */

add_action( 'rest_api_init', 'mikra_flow_rest' );
function mikra_flow_rest() {
	register_rest_route(
		'wc/mikra',
		'/flow-test',
		array(
			'methods'             => 'POST',
			'permission_callback' => function () {
				return current_user_can( 'manage_woocommerce' );
			},
			'callback'            => function ( $req ) {
				$to   = sanitize_email( (string) $req->get_param( 'email' ) );
				$flow = (string) $req->get_param( 'flow' );
				$step = (int) $req->get_param( 'step' );
				if ( ! $to ) {
					return new WP_Error( 'mikra_email', 'missing email', array( 'status' => 400 ) );
				}
				$unsub = home_url( '/?mikra_unsub_e=test&t=test' );
				if ( 'winback' === $flow ) {
					$mail = mikra_winback_email( $step, sanitize_text_field( (string) $req->get_param( 'name' ) ), $unsub, 'BACK10-TEST1' );
				} else {
					$order = wc_get_order( (int) $req->get_param( 'order_id' ) );
					if ( ! $order ) {
						return new WP_Error( 'mikra_order', 'order_id not found', array( 'status' => 400 ) );
					}
					$mail = 'abandon' === $flow ? mikra_abandon_email( $step, $order, $unsub ) : mikra_post_email( $step, $order, $unsub );
				}
				if ( ! $mail ) {
					return array( 'sent' => false, 'reason' => 'no email for this step' );
				}
				return array( 'sent' => (bool) mikra_send_html( $to, '[בדיקה] ' . $mail[0], $mail[1] ), 'subject' => $mail[0] );
			},
		)
	);
}
