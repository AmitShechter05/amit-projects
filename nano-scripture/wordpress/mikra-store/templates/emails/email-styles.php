<?php
/**
 * הסגנון של ווקומרס מוחלף בזה. כל העיצוב יושב בתוך התגיות עצמן
 * (תוכנות דואר מתעלמות מרוב ה-CSS), וכאן רק ההתאמה לטלפון.
 */

defined( 'ABSPATH' ) || exit;
?>
body { margin:0; padding:0; background:#fbf8f1; }
img { -ms-interpolation-mode:bicubic; }
a { color:#96661c; }
@media (max-width:620px) {
	.mikra-wrap { width:100% !important; }
	.mikra-pad { padding-left:20px !important; padding-right:20px !important; }
	.mikra-h1 { font-size:26px !important; }
}
