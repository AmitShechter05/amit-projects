<?php
/**
 * הזמנה שמחכה לתשלום ידני ("בהמתנה").
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
		'intro'       => $mikra_hi . 'קיבלנו את ההזמנה. נשלח לך בוואטסאפ קישור מאובטח לתשלום, ואחרי התשלום מתחילים לחרוט את הברכה.',
		'total_label' => 'סה״כ לתשלום',
	)
);

do_action( 'woocommerce_email_footer', $email );
