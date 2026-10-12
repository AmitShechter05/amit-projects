<?php
/**
 * תזכורת לתשלום שלא הושלם.
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
		'intro'       => $mikra_hi . 'ראינו שהתחלת להזמין ולא סיימת את התשלום. שמרנו לך את ההזמנה, עם הברכה שבחרת, ואפשר להשלים אותה בלחיצה:',
		'pay_button'  => true,
		'total_label' => 'סה״כ לתשלום',
	)
);

do_action( 'woocommerce_email_footer', $email );
