<?php
/**
 * templates/header/header-mega.php
 * Purpose: Mega header markup. Keep logic minimal; rely on WordPress menus.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<header class="site-header">
    <a class="header-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="brandedUK home">
        <img class="logo-mark" src="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/images/brands/bd-circle.svg' ); ?>" alt="" aria-hidden="true">
        <span class="logo-text">branded<span class="logo-uk">UK</span></span>
    </a>
    <!-- TODO: move the prototype header markup here and convert links to WP menu output -->
</header>
