<?php
/**
 * החזר כספי, מלא או חלקי.
 * העיצוב והחלקים המשותפים: templates/parts/body.php.
 *
 * @var WC_Order $order
 * @var string   $email_heading
 * @var WC_Email $email
 */

defined( 'ABSPATH' ) || exit;

$mikra_hi = 'שלום ' . esc_html( $order->get_billing_first_name() ) . ', ';

do_action( 'woocommerce_email_header', $email_heading, $email );

$mikra_partial = ! empty( $partial_refund );
mikra_store_email_body(
	$order,
	array(
		'intro'       => $mikra_hi . ( $mikra_partial ? 'החזרנו לך חלק מהתשלום על ההזמנה.' : 'החזרנו לך את התשלום על ההזמנה.' ) . ' הכסף חוזר לאמצעי התשלום שבו שילמת, ולפעמים לוקח כמה ימי עסקים עד שזה מופיע.',
		'total_label' => 'סה״כ ששולם',
	)
);

do_action( 'woocommerce_email_footer', $email );
