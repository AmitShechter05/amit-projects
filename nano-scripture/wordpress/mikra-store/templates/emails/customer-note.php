<?php
/**
 * הודעה שהוספת להזמנה ("הערה ללקוח").
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
		'intro'       => $mikra_hi . 'יש עדכון על ההזמנה שלך:',
		'note'        => isset( $customer_note ) ? (string) $customer_note : '',
		'total_label' => 'סה״כ',
	)
);

do_action( 'woocommerce_email_footer', $email );
