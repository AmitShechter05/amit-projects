<?php
/**
 * סוף המייל: תיבת וואטסאפ (רק במיילים ללקוח), סגירת הכרטיס, ושורת
 * התחתית.
 *
 * @var WC_Email|null $email
 */

defined( 'ABSPATH' ) || exit;

$mikra_email    = mikra_store_current_email( isset( $email ) ? $email : null );
$mikra_customer = $mikra_email && isset( $mikra_email->id ) && 0 === strpos( (string) $mikra_email->id, 'customer_' );
$mikra_order    = ( $mikra_email && isset( $mikra_email->object ) && $mikra_email->object instanceof WC_Order ) ? $mikra_email->object : null;
?>
			</td></tr>

			<?php if ( $mikra_customer ) : ?>
			<tr><td class="mikra-pad" style="padding:30px 40px 36px;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f1;border-radius:10px;">
					<tr><td style="padding:20px 22px;font-family:Heebo,Arial,Helvetica,sans-serif;text-align:right;">
						<p style="margin:0;font-size:15px;font-weight:700;color:#16150f;">שאלה? רוצים להחליף ברכה?</p>
						<p style="margin:4px 0 14px;font-size:14px;line-height:1.6;color:#4a4840;">אפשר להחליף כל עוד ההזמנה לא נשלחה. פשוט כתבו לנו, או השיבו למייל הזה.</p>
						<a href="<?php echo esc_url( mikra_store_wa_url( $mikra_order ) ); ?>" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 22px;border-radius:8px;font-family:Heebo,Arial,Helvetica,sans-serif;"><img src="<?php echo esc_url( MIKRA_SITE . '/brand/whatsapp-white.png' ); ?>" width="18" height="18" alt="" style="vertical-align:-3px;margin-left:6px;border:0;" />כתבו לנו בוואטסאפ</a>
					</td></tr>
				</table>
			</td></tr>
			<?php else : ?>
			<tr><td style="padding:0 0 32px;"></td></tr>
			<?php endif; ?>
		</table>
	</td></tr>

	<tr><td align="center" style="padding:24px 20px 0;font-family:Heebo,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.8;color:#8a877c;">
		מִקְרָא · תכשיטים עם ברכה חרוטה<br />
		<a href="<?php echo esc_url( MIKRA_SITE ); ?>" style="color:#96661c;text-decoration:none;">mikra.shop</a> · <?php echo esc_html( MIKRA_PHONE ); ?> · <?php echo esc_html( MIKRA_EMAIL ); ?>
	</td></tr>
</table>

</td></tr>
</table>
</body>
</html>
