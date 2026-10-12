<?php
/**
 * גוף המייל. נטען מתוך mikra_store_email_body().
 *
 * @var WC_Order $order
 * @var array    $args
 */

defined( 'ABSPATH' ) || exit;

$mikra_line = 'border-top:1px solid #efe6d4;';
$mikra_font = 'font-family:Heebo,Arial,Helvetica,sans-serif;';
?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<?php if ( '' !== $args['intro'] ) : ?>
<tr><td class="mikra-pad" style="padding:12px 40px 0;<?php echo $mikra_font; ?>">
	<p style="margin:0;font-size:16px;line-height:1.7;color:#4a4840;text-align:right;"><?php echo wp_kses_post( $args['intro'] ); ?></p>
</td></tr>
<?php endif; ?>

<?php if ( '' !== $args['note'] ) : ?>
<tr><td class="mikra-pad" style="padding:16px 40px 0;<?php echo $mikra_font; ?>">
	<div style="padding:16px 18px;background:#f6efe1;border-radius:10px;font-size:15px;line-height:1.7;color:#16150f;text-align:right;"><?php echo wp_kses_post( wpautop( wptexturize( $args['note'] ) ) ); ?></div>
</td></tr>
<?php endif; ?>

<?php if ( $args['pay_button'] ) : ?>
<tr><td class="mikra-pad" style="padding:20px 40px 0;<?php echo $mikra_font; ?>">
	<a href="<?php echo esc_url( mikra_store_pay_url( $order ) ); ?>" style="display:inline-block;background:#96661c;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 26px;border-radius:8px;">לתשלום מאובטח · <?php echo wp_kses_post( mikra_store_money( $order->get_total(), $order ) ); ?></a>
</td></tr>
<?php endif; ?>

<!-- מספר ההזמנה -->
<tr><td class="mikra-pad" style="padding:20px 40px 0;<?php echo $mikra_font; ?>">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6efe1;border-radius:10px;">
		<tr>
			<td style="padding:14px 18px;font-size:14px;color:#4a4840;text-align:right;">מספר ההזמנה</td>
			<td style="padding:14px 18px;font-size:20px;font-weight:700;text-align:left;direction:ltr;color:#16150f;">#<?php echo esc_html( $order->get_order_number() ); ?></td>
		</tr>
	</table>
</td></tr>

<!-- מה הוזמן -->
<tr><td class="mikra-pad" style="padding:28px 40px 0;<?php echo $mikra_font; ?>">
	<p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#16150f;text-align:right;">מה הזמנת</p>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
	<?php
	foreach ( $order->get_items() as $mikra_item ) :
		$mikra_img      = mikra_store_item_image( $mikra_item );
		$mikra_blessing = (string) $mikra_item->get_meta( 'הברכה', true );
		$mikra_qty      = (int) $mikra_item->get_quantity();
		?>
		<tr>
			<?php if ( $mikra_img ) : ?>
			<td width="76" style="padding:14px 0;<?php echo $mikra_line; ?>vertical-align:middle;">
				<img src="<?php echo esc_url( $mikra_img ); ?>" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border:1px solid #efe6d4;border-radius:8px;" />
			</td>
			<?php endif; ?>
			<td style="padding:14px 12px;<?php echo $mikra_line; ?>vertical-align:middle;text-align:right;">
				<p style="margin:0;font-size:16px;font-weight:700;color:#16150f;"><?php echo esc_html( $mikra_item->get_name() ); ?><?php if ( $mikra_qty > 1 ) : ?> <span style="font-weight:400;color:#8a877c;">× <?php echo (int) $mikra_qty; ?></span><?php endif; ?></p>
				<?php if ( '' !== $mikra_blessing ) : ?>
				<p style="margin:3px 0 0;font-size:13px;color:#6b6a63;">ברכה: <?php echo esc_html( $mikra_blessing ); ?></p>
				<?php endif; ?>
			</td>
			<td style="padding:14px 0;<?php echo $mikra_line; ?>vertical-align:middle;text-align:left;font-size:15px;white-space:nowrap;color:#16150f;"><?php echo wp_kses_post( mikra_store_money( $mikra_item->get_subtotal(), $order ) ); ?></td>
		</tr>
	<?php endforeach; ?>
	</table>

	<!-- סיכום -->
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="<?php echo $mikra_line; ?>">
		<?php foreach ( $order->get_fees() as $mikra_fee ) : ?>
		<tr><td style="padding:10px 0 2px;font-size:14px;color:#4a4840;text-align:right;"><?php echo esc_html( $mikra_fee->get_name() ); ?></td><td style="padding:10px 0 2px;font-size:14px;text-align:left;color:#16150f;"><?php echo wp_kses_post( mikra_store_money( $mikra_fee->get_total(), $order ) ); ?></td></tr>
		<?php endforeach; ?>
		<?php if ( $order->get_shipping_method() ) : ?>
		<tr><td style="padding:10px 0 2px;font-size:14px;color:#4a4840;text-align:right;"><?php echo esc_html( $order->get_shipping_method() ); ?></td><td style="padding:10px 0 2px;font-size:14px;text-align:left;color:#16150f;"><?php echo (float) $order->get_shipping_total() > 0 ? wp_kses_post( mikra_store_money( $order->get_shipping_total(), $order ) ) : 'חינם'; ?></td></tr>
		<?php endif; ?>
		<?php if ( (float) $order->get_total_discount() > 0 ) : ?>
		<tr><td style="padding:4px 0 2px;font-size:14px;color:#96661c;text-align:right;">הנחה</td><td style="padding:4px 0 2px;font-size:14px;color:#96661c;text-align:left;direction:ltr;">−<?php echo wp_kses_post( mikra_store_money( $order->get_total_discount(), $order ) ); ?></td></tr>
		<?php endif; ?>
		<tr><td style="padding:14px 0 0;border-top:1px solid #d9c7a3;font-size:15px;color:#4a4840;text-align:right;"><?php echo esc_html( $args['total_label'] ); ?></td><td style="padding:14px 0 0;border-top:1px solid #d9c7a3;font-size:22px;font-weight:800;text-align:left;color:#16150f;"><?php echo wp_kses_post( mikra_store_money( $order->get_total(), $order ) ); ?></td></tr>
		<?php if ( (float) $order->get_total_refunded() > 0 ) : ?>
		<tr><td style="padding:6px 0 0;font-size:14px;color:#96661c;text-align:right;">הוחזר</td><td style="padding:6px 0 0;font-size:14px;color:#96661c;text-align:left;direction:ltr;">−<?php echo wp_kses_post( mikra_store_money( $order->get_total_refunded(), $order ) ); ?></td></tr>
		<?php endif; ?>
	</table>
</td></tr>

<!-- לאן -->
<?php
$mikra_to = trim( implode( ', ', array_filter( array( trim( $order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name() ), $order->get_shipping_address_1(), $order->get_shipping_city() ) ) ) );
if ( $order->has_shipping_address() && '' !== $mikra_to ) :
	?>
<tr><td class="mikra-pad" style="padding:22px 40px 0;<?php echo $mikra_font; ?>">
	<p style="margin:0;font-size:14px;line-height:1.7;color:#6b6a63;text-align:right;">נשלח אל: <?php echo esc_html( $mikra_to ); ?></p>
</td></tr>
<?php endif; ?>

<?php if ( $args['steps'] ) : ?>
<!-- מה קורה עכשיו -->
<tr><td class="mikra-pad" style="padding:30px 40px 0;<?php echo $mikra_font; ?>">
	<p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#16150f;text-align:right;">מה קורה עכשיו</p>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
		<?php
		$mikra_steps = array(
			array( 'א', 'חורטים את הברכה', 'על השבב, ובודקים אותה מול הטקסט המקורי, אות אחרי אות.' ),
			array( 'ב', 'אורזים', 'בקופסה מרופדת, עם כרטיס שיש בו את הברכה המלאה.' ),
			array( 'ג', 'שולחים', 'נשלח לך מייל כשההזמנה יוצאת. המשלוח מגיע תוך 2-4 ימי עסקים.' ),
		);
		foreach ( $mikra_steps as $mikra_step ) :
			?>
		<tr>
			<td width="40" style="vertical-align:top;padding:0 0 14px;"><div style="width:28px;height:28px;line-height:28px;text-align:center;border:1px solid #d9c7a3;border-radius:7px;font-size:13px;color:#96661c;"><?php echo esc_html( $mikra_step[0] ); ?></div></td>
			<td style="vertical-align:top;padding:2px 0 14px;text-align:right;"><p style="margin:0;font-size:15px;font-weight:700;color:#16150f;"><?php echo esc_html( $mikra_step[1] ); ?></p><p style="margin:2px 0 0;font-size:14px;line-height:1.6;color:#4a4840;"><?php echo esc_html( $mikra_step[2] ); ?></p></td>
		</tr>
		<?php endforeach; ?>
	</table>
</td></tr>
<?php endif; ?>
</table>
