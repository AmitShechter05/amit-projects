<?php
/**
 * מסך "מקרא · אוטומציות" (ווקומרס → מקרא · אוטומציות).
 *
 * מי נמצא עכשיו בזרימה = מי שיש לו מייל מתוזמן (זה מקור האמת: מה
 * שמתוזמן הוא מה שיישלח). מתחת - היומן: מי נכנס, מה נשלח, מי יצא
 * ולמה, ומי הוסר. למעלה - כמה מיילים יצאו ב-24 שעות, ואם יש SMTP.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', 'mikra_admin_menu', 60 );
function mikra_admin_menu() {
	add_submenu_page( 'woocommerce', 'מקרא · אוטומציות', 'מקרא · אוטומציות', 'manage_woocommerce', 'mikra-flows', 'mikra_admin_page' );
}

function mikra_admin_time( $ts ) {
	if ( ! $ts ) {
		return '';
	}
	return ( new DateTime( '@' . (int) $ts ) )->setTimezone( mikra_tz() )->format( 'd.m H:i' );
}

/** שם השלב, לפי הזרימה */
function mikra_step_label( $flow, $step ) {
	$labels = array(
		'abandon' => array( 1 => 'נשאר רק צעד אחד', 3 => 'הוכחה: ככה נראית ברכה על שבב', 2 => 'ההנחה (קוד)', 4 => 'מכתב מעמית', 9 => 'סיום (ביטול אם לא שולמה)' ),
		'post'    => array( 0 => 'מכתב תודה (לקוח חוזר)', 1 => 'לפני שעונדים', 2 => 'עוד ברכה למישהו', 3 => 'איך התכשיט? (ביקורת)' ),
		'winback' => array( 1 => 'מה חדש אצלך?', 2 => 'משהו קטן בשבילך', 3 => 'ההטבה נגמרת מחר', 4 => 'שאלה קטנה ממני' ),
		'series'  => array( 1 => 'ברוכים הבאים', 3 => 'למי המתנה', 2 => 'ככה נראית ברכה', 4 => 'ככה זה נראה עליכם', 5 => 'ההנחה מסתיימת מחר' ),
	);
	return isset( $labels[ $flow ][ $step ] ) ? $labels[ $flow ][ $step ] : ( 'שלב ' . $step );
}

function mikra_flow_label( $flow ) {
	$l = array( 'abandon' => 'נטישה', 'post' => 'אחרי הזמנה', 'winback' => 'חזרה', 'series' => 'הצטרפות' );
	return isset( $l[ $flow ] ) ? $l[ $flow ] : $flow;
}

/** כל המיילים המתוזמנים של הזרימות ושל סדרת ההצטרפות */
function mikra_scheduled() {
	$out  = array();
	$cron = function_exists( '_get_cron_array' ) ? _get_cron_array() : array();
	foreach ( (array) $cron as $ts => $hooks ) {
		foreach ( array( 'mikra_flow', 'mikra_store_series' ) as $hook ) {
			if ( empty( $hooks[ $hook ] ) ) {
				continue;
			}
			foreach ( $hooks[ $hook ] as $ev ) {
				$a = isset( $ev['args'] ) ? $ev['args'] : array();
				if ( 'mikra_flow' === $hook && 3 === count( $a ) ) {
					$out[] = array( 't' => (int) $ts, 'flow' => (string) $a[0], 'key' => $a[1], 'step' => (int) $a[2] );
				} elseif ( 'mikra_store_series' === $hook && 2 === count( $a ) ) {
					$out[] = array( 't' => (int) $ts, 'flow' => 'series', 'key' => (int) $a[0], 'step' => (int) $a[1] );
				}
			}
		}
	}
	usort(
		$out,
		function ( $x, $y ) {
			return $x['t'] - $y['t'];
		}
	);
	return $out;
}

/** מי זה: כתובת, שם וקישור להזמנה */
function mikra_who( $flow, $key ) {
	if ( 'abandon' === $flow || 'post' === $flow ) {
		$o = wc_get_order( (int) $key );
		if ( ! $o ) {
			return array( '', '', '' );
		}
		return array( $o->get_billing_email(), trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ), '<a href="' . esc_url( $o->get_edit_order_url() ) . '">#' . esc_html( $o->get_order_number() ) . '</a>' );
	}
	if ( 'series' === $flow ) {
		$u = get_userdata( (int) $key );
		return array( $u ? $u->user_email : '', $u ? (string) get_user_meta( $u->ID, 'first_name', true ) : '', '' );
	}
	$state = get_option( 'mikra_winback', array() );
	$k     = mikra_ekey( (string) $key );
	return array( (string) $key, isset( $state[ $k ]['name'] ) ? $state[ $k ]['name'] : '', '' );
}

function mikra_admin_page() {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	$log    = get_option( 'mikra_flow_log', array() );
	$log    = is_array( $log ) ? $log : array();
	$day    = time() - DAY_IN_SECONDS;
	$sent   = 0;
	$failed = 0;
	foreach ( $log as $r ) {
		if ( $r['t'] < $day ) {
			break;
		}
		if ( 'sent' === $r['k'] ) {
			$sent++;
		} elseif ( 'fail' === $r['k'] ) {
			$failed++;
		}
	}
	$smtp       = has_action( 'phpmailer_init' );
	$suppressed = count( (array) get_option( 'mikra_suppressed', array() ) );
	$sched      = mikra_scheduled();
	$people     = array();
	foreach ( $sched as $s ) {
		$people[ $s['flow'] . '|' . $s['key'] ] = true;
	}
	$counts = array( 'abandon' => 0, 'post' => 0, 'winback' => 0, 'series' => 0 );
	foreach ( array_keys( $people ) as $p ) {
		$f = strstr( $p, '|', true );
		if ( isset( $counts[ $f ] ) ) {
			$counts[ $f ]++;
		}
	}

	echo '<div class="wrap" dir="rtl" style="max-width:1200px">';
	echo '<h1>מקרא · אוטומציות</h1>';

	// הסרה ידנית: מי שענה "הסר" במייל - מדביקים את הכתובת, והיא יוצאת מכל הזרימות
	if ( isset( $_POST['mikra_remove'] ) && check_admin_referer( 'mikra_remove' ) ) {
		$rm = sanitize_email( wp_unslash( (string) $_POST['mikra_remove'] ) );
		if ( $rm ) {
			mikra_suppress( $rm );
			mikra_unschedule( 'winback', $rm, array( 1, 2, 3, 4 ) );
			echo '<div class="notice notice-success"><p>הוסר: <span dir="ltr">' . esc_html( $rm ) . '</span>. לא יקבל יותר מיילים שיווקיים מאף זרימה.</p></div>';
		} else {
			echo '<div class="notice notice-error"><p>הכתובת לא תקינה.</p></div>';
		}
	}
	echo '<form method="post" style="margin:12px 0;background:#fff;border:1px solid #dcdcde;padding:12px 16px">';
	wp_nonce_field( 'mikra_remove' );
	echo '<label><b>להסיר כתובת</b> (מי שענה "הסר" במייל): <input type="email" name="mikra_remove" dir="ltr" style="width:280px" required></label> ';
	echo '<button class="button button-primary">להסיר</button></form>';
	echo '<style>.mk-cards{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.mk-card{background:#fff;border:1px solid #dcdcde;padding:14px 18px;min-width:150px}.mk-card b{display:block;font-size:24px;line-height:1.3}.mk-tag{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px}.mk-enter{background:#e7f0fb}.mk-sent{background:#e8f5e9}.mk-exit{background:#fff4e5}.mk-unsub{background:#fde8e8}.mk-fail{background:#fde8e8}.mk-warn{background:#fff4e5;border-right:4px solid #dba617;padding:10px 14px;margin:10px 0}</style>';

	// מצב שליחה
	if ( ! $smtp ) {
		echo '<div class="mk-warn"><b>אין תוסף SMTP.</b> המיילים יוצאים דרך השרת, ו-Hostinger מגבילים את זה ל-100 ביום ו-10 בדקה - כולל מיילי ההזמנות. מעבר לזה מיילים לא יוצאים, בלי הודעה. כדאי לחבר תוסף SMTP לתיבה orders@mikra.shop.</div>';
	}
	if ( defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON ) {
		echo '<p>המשימות המתוזמנות רצות מ-Cron של השרת (DISABLE_WP_CRON).</p>';
	}

	echo '<div class="mk-cards">';
	echo '<div class="mk-card">נשלחו ב-24 שעות<b>' . (int) $sent . '</b>' . ( $smtp ? 'דרך SMTP' : 'מתוך 100 לכל היותר' ) . '</div>';
	echo '<div class="mk-card">נכשלו ב-24 שעות<b>' . (int) $failed . '</b></div>';
	foreach ( $counts as $f => $n ) {
		echo '<div class="mk-card">בזרימת ' . esc_html( mikra_flow_label( $f ) ) . '<b>' . (int) $n . '</b></div>';
	}
	echo '<div class="mk-card">הוסרו מהרשימה<b>' . (int) $suppressed . '</b></div>';
	echo '</div>';

	// בזרימה עכשיו
	echo '<h2>בזרימה עכשיו - המייל הבא של כל אחד</h2>';
	if ( ! $sched ) {
		echo '<p>אין כרגע אף אחד בזרימה.</p>';
	} else {
		echo '<table class="widefat striped"><thead><tr><th>מתי (שעון ישראל)</th><th>זרימה</th><th>המייל הבא</th><th>לקוח</th><th>הזמנה</th></tr></thead><tbody>';
		foreach ( $sched as $s ) {
			list( $email, $name, $link ) = mikra_who( $s['flow'], $s['key'] );
			echo '<tr><td>' . esc_html( mikra_admin_time( $s['t'] ) ) . '</td><td>' . esc_html( mikra_flow_label( $s['flow'] ) ) . '</td><td>' . esc_html( mikra_step_label( $s['flow'], $s['step'] ) ) . '</td>'
				. '<td>' . esc_html( $name ) . ( $name ? '<br>' : '' ) . '<span dir="ltr">' . esc_html( $email ) . '</span></td><td>' . $link . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</tbody></table>';
	}
	echo '<p class="description">מייל שנופל על שבת, חג, לילה, או יום שכבר יצא בו מייל ללקוח - נדחה אוטומטית, והזמן כאן יתעדכן כשיגיע תורו.</p>';

	// יומן
	echo '<h2>יומן</h2>';
	if ( ! $log ) {
		echo '<p>עוד לא קרה כלום.</p>';
	} else {
		$kind = array( 'enter' => array( 'נכנס', 'mk-enter' ), 'sent' => array( 'נשלח', 'mk-sent' ), 'exit' => array( 'יצא', 'mk-exit' ), 'unsub' => array( 'הוסר', 'mk-unsub' ), 'fail' => array( 'נכשל', 'mk-fail' ) );
		echo '<table class="widefat striped"><thead><tr><th>מתי</th><th>מה</th><th>זרימה</th><th>פרטים</th><th>לקוח</th><th>הזמנה</th></tr></thead><tbody>';
		foreach ( array_slice( $log, 0, 150 ) as $r ) {
			$k    = isset( $kind[ $r['k'] ] ) ? $kind[ $r['k'] ] : array( $r['k'], '' );
			$link = '';
			if ( ! empty( $r['o'] ) ) {
				$o    = wc_get_order( (int) $r['o'] );
				$link = $o ? '<a href="' . esc_url( $o->get_edit_order_url() ) . '">#' . esc_html( $o->get_order_number() ) . '</a>' : '#' . (int) $r['o'];
			}
			echo '<tr><td>' . esc_html( mikra_admin_time( $r['t'] ) ) . '</td><td><span class="mk-tag ' . esc_attr( $k[1] ) . '">' . esc_html( $k[0] ) . '</span></td>'
				. '<td>' . esc_html( $r['f'] ? mikra_flow_label( $r['f'] ) : '' ) . '</td><td>' . esc_html( $r['x'] ) . '</td><td dir="ltr" style="text-align:right">' . esc_html( $r['e'] ) . '</td><td>' . $link . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</tbody></table>';
	}
	echo '</div>';
}
