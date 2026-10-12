<?php
/**
 * ההזמנה נשלחה ("הושלמה").
 * העיצוב והחלקים המשותפים: templates/parts/body.php.
 *
 * @var WC_Order $order
 * @var string   $email_heading
 * @var WC_Email $email
 */

defined( 'ABSPATH' ) || exit;

$mikra_hi = 'שלום ' . esc_html( $order->get_billing_first_name() ) . ', ';

do_action( 'woocommerce_email_header', $email_heading, $email );

mikra_store_email_body(
	$order,
	array(
		'intro'       => $mikra_hi . 'התכשיט נארז ויצא אליך. המשלוח מגיע תוך 2-4 ימי עסקים. אם משהו לא תקין כשהחבילה מגיעה, כתבו לנו ונסדר.',
		'total_label' => 'סה״כ ששולם',
	)
);

do_action( 'woocommerce_email_footer', $email );
