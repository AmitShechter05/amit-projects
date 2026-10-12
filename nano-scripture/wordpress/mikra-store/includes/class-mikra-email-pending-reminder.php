<?php
/**
 * תזכורת לתשלום שלא הושלם ("עגלה נטושה").
 *
 * לקוח שמילא פרטים בקופה, נוצרה לו הזמנה, והוא לא סיים לשלם - מקבל
 * אחרי 15 דקות מייל עם ההזמנה וכפתור להשלמת התשלום בעמוד שלנו. המייל
 * מופיע ברשימת המיילים של ווקומרס ("תזכורת לתשלום (מקרא)"), ושם אפשר
 * לכבות אותו או לשנות את הנושא.
 *
 * זה מייל שירות על הזמנה שהלקוח עצמו התחיל, לא פרסומת: בלי מבצעים
 * ובלי מוצרים אחרים.
 */

defined( 'ABSPATH' ) || exit;

class Mikra_Email_Pending_Reminder extends WC_Email {

	public function __construct() {
		$this->id             = 'customer_pending_reminder';
		$this->customer_email = true;
		$this->title          = 'תזכורת לתשלום (מקרא)';
		$this->description    = 'נשלח ללקוח שיצר הזמנה ולא סיים לשלם, 15 דקות אחרי. ההזמנה נשמרת לו עוד יום.';
		$this->template_html  = 'emails/customer-pending-reminder.php';
		$this->template_plain = 'emails/customer-pending-reminder.php';
		$this->template_base  = MIKRA_STORE_DIR . 'templates/';
		$this->placeholders   = array( '{order_number}' => '' );

		parent::__construct();
	}

	public function get_default_subject() {
		return 'ההזמנה שלך #{order_number} מחכה לך · מקרא';
	}

	public function get_default_heading() {
		return 'התכשיט שלך מחכה לך';
	}

	/** רק HTML - בלי גרסת טקסט פשוט */
	public function get_email_type() {
		return 'html';
	}

	/**
	 * @param int $order_id
	 * @return bool נשלח או לא
	 */
	public function trigger( $order_id ) {
		$this->setup_locale();

		$sent  = false;
		$order = wc_get_order( $order_id );
		if ( $order ) {
			$this->object                         = $order;
			$this->recipient                      = $order->get_billing_email();
			$this->placeholders['{order_number}'] = $order->get_order_number();

			if ( $this->is_enabled() && $this->get_recipient() ) {
				$sent = (bool) $this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() );
			}
		}

		$this->restore_locale();
		return $sent;
	}

	public function get_content_html() {
		return wc_get_template_html(
			$this->template_html,
			array(
				'order'              => $this->object,
				'email_heading'      => $this->get_heading(),
				'additional_content' => '',
				'sent_to_admin'      => false,
				'plain_text'         => false,
				'email'              => $this,
			),
			'',
			$this->template_base
		);
	}

	public function get_content_plain() {
		return wp_strip_all_tags( $this->get_content_html() );
	}
}
