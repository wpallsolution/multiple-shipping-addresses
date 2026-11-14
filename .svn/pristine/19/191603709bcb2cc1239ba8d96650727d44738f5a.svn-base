<?php
/**
 * Uninstall Plugin
 *
 * Removes the address table and the plugin options, on every site of a multisite network.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

/**
 * Remove the data of the current site.
 */
function hplugin_uninstall_site() {
    global $wpdb;
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}hplugin_addresses" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    delete_option( 'hplugin_settings' );
    delete_option( 'hplugin_db_version' );
}

if ( is_multisite() ) {
    foreach ( get_sites( array( 'fields' => 'ids' ) ) as $hplugin_blog_id ) {
        switch_to_blog( $hplugin_blog_id );
        hplugin_uninstall_site();
        restore_current_blog();
    }
    delete_site_option( 'hplugin_db_version' );
} else {
    hplugin_uninstall_site();
}
