<?php
/**
 * "פרטי הזמנה" - נשלח ידנית מהניהול. אם ההזמנה עוד לא שולמה, יש בו כפתור לתשלום בעמוד שלנו.
 * העיצוב והחלקים המשותפים: templates/parts/body.php.
 *
 * @var WC_Order $order
 * @var string   $email_heading
 * @var WC_Email $email
 */

defined( 'ABSPATH' ) || exit;

$mikra_hi = 'שלום ' . esc_html( $order->get_billing_first_name() ) . ', ';

do_action( 'woocommerce_email_header', $email_heading, $email );

$mikra_unpaid = $order->needs_payment();
mikra_store_email_body(
	$order,
	array(
		'intro'       => $mikra_hi . ( $mikra_unpaid ? 'הנה פרטי ההזמנה שלך. אפשר לשלם בקישור המאובטח:' : 'הנה פרטי ההזמנה שלך.' ),
		'pay_button'  => $mikra_unpaid,
		'total_label' => $mikra_unpaid ? 'סה״כ לתשלום' : 'סה״כ ששולם',
	)
);

do_action( 'woocommerce_email_footer', $email );
