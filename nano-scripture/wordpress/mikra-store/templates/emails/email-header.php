<?php
/**
 * ראש המייל: רקע שמנת, לוגו, ופתיחת הכרטיס הלבן.
 * במיילים של הזמנה שהתקבלה / נשלחה יש גם תמונה של הזוג מהצילומים.
 *
 * @var string        $email_heading
 * @var WC_Email|null $email
 */

defined( 'ABSPATH' ) || exit;

$mikra_email    = mikra_store_current_email( isset( $email ) ? $email : null );
$mikra_email_id = ( $mikra_email && isset( $mikra_email->id ) ) ? (string) $mikra_email->id : '';
$mikra_customer = 0 === strpos( $mikra_email_id, 'customer_' );
/*
 * תמונת הזוג עם הכותרת כתובה עליה (עמית, 12.10.2026: "נגדיל אותה שיראו
 * את התכשיטים, ואת 'תודה, ההזמנה התקבלה' לשים על התמונה"). הכותרת
 * צרובה בתמונה, כי טקסט מעל תמונת רקע לא מוצג באאוטלוק.
 */
$mikra_heroes = array(
	'customer_processing_order' => 'email-hero-received.jpg',
	'customer_on_hold_order'    => 'email-hero-received.jpg',
	'customer_completed_order'  => 'email-hero-shipped.jpg',
	'customer_pending_reminder' => 'email-hero-reminder.jpg',
);
$mikra_hero   = isset( $mikra_heroes[ $mikra_email_id ] ) ? $mikra_heroes[ $mikra_email_id ] : '';
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title><?php echo esc_html( get_bloginfo( 'name', 'display' ) ); ?></title>
	<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet" />
</head>
<body dir="rtl" style="margin:0;padding:0;background:#fbf8f1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f1;">
<tr><td align="center" style="padding:32px 12px;">

<table role="presentation" class="mikra-wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;font-family:Heebo,Arial,Helvetica,sans-serif;color:#16150f;direction:rtl;text-align:right;">
	<tr><td align="center" style="padding:0 0 24px;">
		<a href="<?php echo esc_url( MIKRA_SITE ); ?>" style="text-decoration:none;"><img src="<?php echo esc_url( MIKRA_SITE . '/brand/mikra-logo-email.png' ); ?>" width="170" alt="מִקְרָא" style="display:block;width:170px;height:auto;border:0;" /></a>
	</td></tr>

	<tr><td style="background:#ffffff;border:1px solid #eadfca;border-radius:14px;">
		<?php if ( $mikra_hero ) : ?>
		<img src="<?php echo esc_url( MIKRA_SITE . '/brand/' . $mikra_hero ); ?>" width="600" alt="<?php echo esc_attr( $email_heading ); ?>" style="display:block;width:100%;height:auto;border:0;border-radius:14px 14px 0 0;" />
		<?php endif; ?>

		<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
			<?php if ( ! $mikra_hero ) : ?>
			<tr><td class="mikra-pad" style="padding:32px 40px 0;">
				<h1 class="mikra-h1" style="margin:0;font-family:Heebo,Arial,Helvetica,sans-serif;font-size:30px;line-height:1.25;font-weight:800;color:#16150f;text-align:right;"><?php echo esc_html( $email_heading ); ?></h1>
			</td></tr>
			<?php else : ?>
			<tr><td style="padding:16px 0 0;"></td></tr>
			<?php endif; ?>

			<?php /* התוכן של כל מייל נכנס לתא הזה. המיילים שלנו (parts/body.php) מביאים ריווח
			משלהם; מיילים אחרים (למשל "הזמנה חדשה" אליך) מקבלים ריווח כאן */ ?>
			<tr><td style="padding:<?php echo $mikra_customer ? '0' : '16px 40px 0'; ?>;font-family:Heebo,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#16150f;text-align:right;">
