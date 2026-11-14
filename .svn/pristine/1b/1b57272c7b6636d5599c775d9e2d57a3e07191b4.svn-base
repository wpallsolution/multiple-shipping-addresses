<?php
/**
 * Plugin Name: H-Shipping Multiple Shipping Addresses for WooCommerce
 * Plugin URI: https://profiles.wordpress.org/hplugin/
 * Description: Allows WooCommerce customers to save multiple shipping addresses in their My Account section and select from these saved addresses during checkout.
 * Version: 1.1.2
 * Author: hPlugin
 * Text Domain: h-shipping-multiple-addresses-for-woocommerce
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * Tested up to: 7.1
 * Requires Plugins: woocommerce
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */
if (!defined('ABSPATH')) {
    exit;
}
/**
 * Define constants
 */
define('HPLUGIN_VERSION', '1.1.2');
define('HPLUGIN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HPLUGIN_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * URL of the online documentation.
 */
function hplugin_docs_url()
{
    return 'https://docs.wpallsolution.com/#/collection/hsm-plugin';
}

/**
 * URL of the support contact page.
 */
function hplugin_support_url()
{
    return 'https://support.wpallsolution.com/';
}

/**
 * "Documentation" and "Support" links under the plugin name on the Plugins page.
 */
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'hplugin_action_links');
function hplugin_action_links($links)
{
    $links[] = '<a href="' . esc_url(hplugin_docs_url()) . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Documentation', 'h-shipping-multiple-addresses-for-woocommerce') . '</a>';
    $links[] = '<a href="' . esc_url(hplugin_support_url()) . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Support', 'h-shipping-multiple-addresses-for-woocommerce') . '</a>';
    return $links;
}
/**
 * Activation hook: Create Database Table
 */
register_activation_hook(__FILE__, 'hplugin_activate');
function hplugin_activate($network_wide)
{
    if (function_exists('is_multisite') && is_multisite() && $network_wide) {
        // Use get_sites() to avoid direct DB query warning
        $blog_ids = get_sites(array('fields' => 'ids'));
        foreach ($blog_ids as $blog_id) {
            switch_to_blog($blog_id);
            hplugin_site_install();
            hplugin_site_defaults();
            hplugin_add_endpoint();
            flush_rewrite_rules();
            restore_current_blog();
        }
    } else {
        hplugin_site_install();
        hplugin_site_defaults();
        hplugin_add_endpoint();
        flush_rewrite_rules();
    }
}

/**
 * Default settings. add_option() never overwrites settings an admin has already saved.
 */
function hplugin_default_settings()
{
    return array(
        'enable_plugin' => '1',
        'max_addresses' => 3,
        'enable_labels' => '1',
        'allow_multiple_checkout' => '1',
        'validate_duplicates' => '1',
    );
}

function hplugin_site_defaults()
{
    add_option('hplugin_settings', hplugin_default_settings());
}

/**
 * Check for DB updates on load
 */
function hplugin_update_db_check()
{
    // Per site: on multisite every site has its own table, so the version is tracked per site.
    if (get_option('hplugin_db_version') !== HPLUGIN_VERSION) {
        hplugin_site_install();
    }
}

/**
 * Handle creation of a new site in Multisite
 */
add_action('wpmu_new_blog', 'hplugin_new_site_setup', 10, 6);
function hplugin_new_site_setup($blog_id, $user_id, $domain, $path, $site_id, $meta)
{
    if (!function_exists('is_plugin_active_for_network')) {
        require_once(ABSPATH . 'wp-admin/includes/plugin.php');
    }

    if (is_plugin_active_for_network(plugin_basename(__FILE__))) {
        switch_to_blog($blog_id);
        hplugin_site_install();
        hplugin_site_defaults();
        hplugin_add_endpoint();
        flush_rewrite_rules();
        restore_current_blog();
    }
}

function hplugin_site_install()
{
    global $wpdb;

    $table_name = $wpdb->prefix . 'hplugin_addresses';
    $charset_collate = $wpdb->get_charset_collate();
    $sql = "CREATE TABLE $table_name (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        user_id bigint(20) unsigned NOT NULL,
        address_name varchar(100) NOT NULL,
        address_label varchar(50) DEFAULT 'Home',
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        company varchar(100),
        address_1 varchar(200) NOT NULL,
        address_2 varchar(200),
        city varchar(100) NOT NULL,
        state varchar(100) NOT NULL,
        postcode varchar(50) NOT NULL,
        country varchar(10) NOT NULL,
        phone varchar(50),
        email varchar(100),
        is_default tinyint(1) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    update_option('hplugin_db_version', HPLUGIN_VERSION);
}


/**
 * Helper: Check if plugin is enabled
 */
function hplugin_is_plugin_enabled()
{
    $options = get_option('hplugin_settings');
    if (!$options || !is_array($options)) {
        return false;
    }

    return isset($options['enable_plugin']) && $options['enable_plugin'] == '1';
}

/**
 * Enqueue Scripts and Styles
 */
function hplugin_enqueue_scripts()
{
    if (!hplugin_is_plugin_enabled()) {
        return;
    }

    $is_account = is_account_page();
    $is_checkout = is_checkout();
    if (!$is_account && !$is_checkout) {
        return;
    }

    wp_enqueue_style('hplugin-style', HPLUGIN_PLUGIN_URL . 'assets/css/hplugin-style.min.css', array(), HPLUGIN_VERSION);
    wp_enqueue_script('hplugin-script', HPLUGIN_PLUGIN_URL . 'assets/js/hplugin-script.min.js', array('jquery'), HPLUGIN_VERSION, true);

    $vars = array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('hplugin_nonce'),
        'messages' => array(
            'confirm_delete' => __('Are you sure you want to delete this address?', 'h-shipping-multiple-addresses-for-woocommerce'),
            'saving' => __('Saving...', 'h-shipping-multiple-addresses-for-woocommerce'),
            'error' => __('An error occurred.', 'h-shipping-multiple-addresses-for-woocommerce'),
            'select_option' => __('Select an option...', 'h-shipping-multiple-addresses-for-woocommerce'),
            'add_title' => __('Add New Address', 'h-shipping-multiple-addresses-for-woocommerce'),
            'edit_title' => __('Edit Address', 'h-shipping-multiple-addresses-for-woocommerce'),
        ),
        // The states list is only used by the address form in My Account.
        'states' => $is_account ? WC()->countries->get_states() : array(),
    );
    wp_localize_script('hplugin-script', 'hplugin_vars', $vars);

    if ($is_checkout && hplugin_is_block_checkout()) {
        hplugin_enqueue_block_checkout();
    }
}

/**
 * Is the checkout page built with the block-based Checkout?
 */
function hplugin_is_block_checkout()
{
    // Look at the page being shown, not the page assigned in WooCommerce settings.
    $page_id = get_queried_object_id();
    if (!$page_id) {
        $page_id = wc_get_page_id('checkout');
    }
    return $page_id > 0 && has_block('woocommerce/checkout', $page_id);
}

/**
 * Saved addresses for the current user, shaped for the checkout scripts.
 */
function hplugin_get_checkout_addresses($user_id)
{
    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d ORDER BY is_default DESC, created_at DESC", $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    $out = array();
    foreach ((array) $rows as $row) {
        $out[] = array(
            'id' => (int) $row->id,
            'name' => $row->address_name,
            'label' => (string) $row->address_label,
            'first_name' => $row->first_name,
            'last_name' => $row->last_name,
            'company' => (string) $row->company,
            'address_1' => $row->address_1,
            'address_2' => (string) $row->address_2,
            'city' => $row->city,
            'state' => $row->state,
            'postcode' => $row->postcode,
            'country' => $row->country,
            'phone' => (string) $row->phone,
            'is_default' => (int) $row->is_default,
        );
    }
    return $out;
}

/**
 * Block checkout: load the script that adds the saved-address picker.
 */
function hplugin_enqueue_block_checkout()
{
    $settings = get_option('hplugin_settings');
    if (empty($settings['allow_multiple_checkout']) || !is_user_logged_in()) {
        return;
    }
    $addresses = hplugin_get_checkout_addresses(get_current_user_id());
    if (!$addresses) {
        return;
    }

    wp_enqueue_script('hplugin-block-checkout', HPLUGIN_PLUGIN_URL . 'assets/js/hplugin-block-checkout.min.js', array('wp-data'), HPLUGIN_VERSION, true);
    wp_localize_script('hplugin-block-checkout', 'hplugin_block_vars', array(
        'addresses' => $addresses,
        'labels_enabled' => !empty($settings['enable_labels']),
        'i18n' => array(
            'title' => __('Select from saved addresses', 'h-shipping-multiple-addresses-for-woocommerce'),
            'new_address' => __('New / Different Address', 'h-shipping-multiple-addresses-for-woocommerce'),
        ),
    ));
}
/**
 * Add "Shipping Addresses" tab to My Account
 */
function hplugin_add_my_account_tab($items)
{
    if (!hplugin_is_plugin_enabled()) {
        return $items;
    }
    $new_items = array();
    foreach ($items as $key => $item) {
        if ($key === 'edit-address') {
            $new_items['shipping-addresses'] = __('Shipping Addresses', 'h-shipping-multiple-addresses-for-woocommerce');
        }
        $new_items[$key] = $item;
    }
    return $new_items;
}
/**
 * Add endpoint for the tab
 */
function hplugin_add_endpoint()
{
    add_rewrite_endpoint('shipping-addresses', EP_ROOT | EP_PAGES);
}

/**
 * Restrict Endpoint Access if Plugin Disabled
 */
function hplugin_restrict_endpoint_access()
{
    if (!function_exists('is_wc_endpoint_url')) {
        return;
    }

    // Check using WC function or raw global
    global $wp_query;
    $is_endpoint = is_wc_endpoint_url('shipping-addresses') || isset($wp_query->query_vars['shipping-addresses']);

    if ($is_endpoint && !hplugin_is_plugin_enabled()) {
        wp_safe_redirect(wc_get_page_permalink('myaccount'));
        exit;
    }
}
/**
 * Content for the Shipping Addresses tab
 */
function hplugin_my_account_tab_content()
{
    if (!hplugin_is_plugin_enabled()) {
        // Backup: If template_redirect failed, use JS redirect
        echo '<script>window.location.href = "' . esc_url(wc_get_page_permalink('myaccount')) . '";</script>';
        return;
    }
    $user_id = get_current_user_id();
    global $wpdb;
    $addresses = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d ORDER BY is_default DESC, created_at DESC", $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

    $settings = get_option('hplugin_settings');
    $max_addresses = isset($settings['max_addresses']) ? intval($settings['max_addresses']) : 3;

    echo '<div class="hplugin-container">';
    echo '<h2>' . esc_html__('My Shipping Addresses', 'h-shipping-multiple-addresses-for-woocommerce') . '</h2>';

    if (count($addresses) < $max_addresses) {
        echo '<button id="hplugin-add-new-btn" class="button alt">' . esc_html__('Add New Address', 'h-shipping-multiple-addresses-for-woocommerce') . '</button>';
    } else {
        /* translators: %d: maximum number of addresses */
        echo '<div class="woocommerce-info">' . sprintf(esc_html__('You have reached the maximum limit of %d saved addresses.', 'h-shipping-multiple-addresses-for-woocommerce'), esc_html($max_addresses)) . '</div>';
    }

    echo '<div id="hplugin-addresses-grid" class="hplugin-grid">';
    if ($addresses) {
        foreach ($addresses as $address) {
            hplugin_render_address_card($address);
        }
    } else {
        echo '<p class="hplugin-no-addresses">' . esc_html__('No saved addresses found.', 'h-shipping-multiple-addresses-for-woocommerce') . '</p>';
    }
    echo '</div>';
    hplugin_render_address_form();
    echo '</div>';
}



/**
 * Render single address card
 */
function hplugin_render_address_card($address)
{
    $country_code = $address->country;
    $countries = WC()->countries->get_countries();
    $country_name = isset($countries[$country_code]) ? $countries[$country_code] : $country_code;
    $default_class = $address->is_default ? 'hplugin-card-default' : '';
    $default_badge = $address->is_default ? '<span class="hplugin-badge">' . esc_html__('Default', 'h-shipping-multiple-addresses-for-woocommerce') . '</span>' : '';
    echo '<div class="hplugin-card ' . esc_attr($default_class) . '" data-id="' . esc_attr($address->id) . '">';
    echo '<div class="hplugin-card-header">';
    echo '<h3>' . esc_html($address->address_name) . '</h3>';
    if (!empty($address->address_label) && $address->address_label !== 'Home') {
        echo '<span class="hplugin-badge hplugin-label-badge">' . esc_html($address->address_label) . '</span>';
    }
    echo wp_kses_post($default_badge);
    echo '</div>';
    echo '<div class="hplugin-card-body">';
    echo '<p><strong>' . esc_html($address->first_name . ' ' . $address->last_name) . '</strong></p>';
    if (!empty($address->company))
        echo '<p>' . esc_html($address->company) . '</p>';
    echo '<p>' . esc_html($address->address_1) . '</p>';
    if (!empty($address->address_2))
        echo '<p>' . esc_html($address->address_2) . '</p>';
    echo '<p>' . esc_html($address->city . ', ' . $address->state . ' ' . $address->postcode) . '</p>';
    echo '<p>' . esc_html($country_name) . '</p>';
    if (!empty($address->phone))
        echo '<p>' . esc_html($address->phone) . '</p>';
    echo '</div>';
    echo '<div class="hplugin-card-actions">';
    echo '<button class="button hplugin-edit-btn" data-id="' . esc_attr($address->id) . '">' . esc_html__('Edit', 'h-shipping-multiple-addresses-for-woocommerce') . '</button>';
    echo '<button class="button hplugin-delete-btn" data-id="' . esc_attr($address->id) . '">' . esc_html__('Delete', 'h-shipping-multiple-addresses-for-woocommerce') . '</button>';
    if (!$address->is_default) {
        echo '<button class="button hplugin-default-btn" data-id="' . esc_attr($address->id) . '">' . esc_html__('Set Default', 'h-shipping-multiple-addresses-for-woocommerce') . '</button>';
    }
    echo '</div>';
    echo '</div>';
}
/**
 * Render Address Form (Hidden)
 */
function hplugin_render_address_form()
{
    ?>
    <div id="hplugin-address-form-modal" class="hplugin-modal" style="display:none;">
        <div class="hplugin-modal-content">
            <span class="hplugin-close">&times;</span>
            <h3 id="hplugin-form-title">
                <?php esc_html_e('Add New Address', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
            </h3>
            <form id="hplugin-address-form">
                <input type="hidden" name="address_id" id="hplugin_address_id" value="">
                <p class="form-row form-row-wide">
                    <label
                        for="hplugin_address_name"><?php esc_html_e('Address Nickname', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                        <span class="required">*</span></label>
                    <input type="text" class="input-text" name="address_name" id="hplugin_address_name" required>
                </p>
                <?php
                $settings = get_option('hplugin_settings');
                if (isset($settings['enable_labels']) && $settings['enable_labels'] == '1'): ?>
                    <p class="form-row form-row-wide">
                        <label
                            for="hplugin_address_label"><?php esc_html_e('Address Type', 'h-shipping-multiple-addresses-for-woocommerce'); ?></label>
                        <select name="address_label" id="hplugin_address_label" class="select">
                            <option value="Home"><?php esc_html_e('Home', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            </option>
                            <option value="Office">
                                <?php esc_html_e('Office', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            </option>
                            <option value="Gift"><?php esc_html_e('Gift', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            </option>
                            <option value="Other"><?php esc_html_e('Other', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            </option>
                        </select>
                    </p>
                <?php endif; ?>
                <div class="hplugin-columns-2">
                    <p class="form-row form-row-first">
                        <label
                            for="hplugin_first_name"><?php esc_html_e('First Name', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            <span class="required">*</span></label>
                        <input type="text" class="input-text" name="first_name" id="hplugin_first_name" required>
                    </p>
                    <p class="form-row form-row-last">
                        <label
                            for="hplugin_last_name"><?php esc_html_e('Last Name', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            <span class="required">*</span></label>
                        <input type="text" class="input-text" name="last_name" id="hplugin_last_name" required>
                    </p>
                </div>
                <p class="form-row form-row-wide">
                    <label
                        for="hplugin_company"><?php esc_html_e('Company', 'h-shipping-multiple-addresses-for-woocommerce'); ?></label>
                    <input type="text" class="input-text" name="company" id="hplugin_company">
                </p>
                <p class="form-row form-row-wide">
                    <label
                        for="hplugin_country"><?php esc_html_e('Country/Region', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                        <span class="required">*</span></label>
                    <select name="country" id="hplugin_country" class="country_select" required>
                        <option value="">
                            <?php esc_html_e('Select a country / region...', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                        </option>
                        <?php
                        $countries = WC()->countries->get_countries();
                        foreach ($countries as $code => $name) {
                            echo '<option value="' . esc_attr($code) . '">' . esc_html($name) . '</option>';
                        }
                        ?>
                    </select>
                </p>
                <p class="form-row form-row-wide">
                    <label
                        for="hplugin_address_1"><?php esc_html_e('Street address', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                        <span class="required">*</span></label>
                    <input type="text" class="input-text" name="address_1" id="hplugin_address_1"
                        placeholder="<?php esc_attr_e('House number and street name', 'h-shipping-multiple-addresses-for-woocommerce'); ?>"
                        required>
                </p>
                <p class="form-row form-row-wide">
                    <input type="text" class="input-text" name="address_2" id="hplugin_address_2"
                        placeholder="<?php esc_attr_e('Apartment, suite, unit, etc. (optional)', 'h-shipping-multiple-addresses-for-woocommerce'); ?>">
                </p>
                <p class="form-row form-row-wide">
                    <label
                        for="hplugin_city"><?php esc_html_e('Town / City', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                        <span class="required">*</span></label>
                    <input type="text" class="input-text" name="city" id="hplugin_city" required>
                </p>
                <div class="hplugin-columns-2">
                    <p class="form-row form-row-first">
                        <label
                            for="hplugin_state"><?php esc_html_e('State / County', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            <span class="required">*</span></label>
                        <select name="state" id="hplugin_state" class="state_select">
                            <option value="">
                                <?php esc_html_e('Select an option...', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            </option>
                        </select>
                        <input type="text" class="input-text" name="state_input" id="hplugin_state_input"
                            style="display:none;">
                    </p>
                    <p class="form-row form-row-last">
                        <label
                            for="hplugin_postcode"><?php esc_html_e('Postcode / ZIP', 'h-shipping-multiple-addresses-for-woocommerce'); ?>
                            <span class="required">*</span></label>
                        <input type="text" class="input-text" name="postcode" id="hplugin_postcode" required>
                    </p>
                </div>
                <div class="hplugin-columns-2">
                    <p class="form-row form-row-first">
                        <label
                            for="hplugin_phone"><?php esc_html_e('Phone', 'h-shipping-multiple-addresses-for-woocommerce'); ?></label>
                        <input type="tel" class="input-text" name="phone" id="hplugin_phone">
                    </p>
                    <p class="form-row form-row-last">
                        <label
                            for="hplugin_email"><?php esc_html_e('Email address', 'h-shipping-multiple-addresses-for-woocommerce'); ?></label>
                        <input type="email" class="input-text" name="email" id="hplugin_email">
                    </p>
                </div>
                <p class="form-row">
                    <label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox">
                        <input type="checkbox"
                            class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox"
                            name="is_default" id="hplugin_is_default">
                        <span><?php esc_html_e('Set as default shipping address', 'h-shipping-multiple-addresses-for-woocommerce'); ?></span>
                    </label>
                </p>
                <div class="hplugin-form-actions">
                    <button type="submit" class="button alt"
                        id="hplugin-save-btn"><?php esc_html_e('Save Address', 'h-shipping-multiple-addresses-for-woocommerce'); ?></button>
                    <button type="button"
                        class="button hplugin-cancel-btn"><?php esc_html_e('Cancel', 'h-shipping-multiple-addresses-for-woocommerce'); ?></button>
                </div>
                <div id="hplugin-form-message"></div>
            </form>
        </div>
    </div>
    <?php
}
/**
 * AJAX Handler: Save Address
 */
function hplugin_ajax_save_address()
{
    if (!hplugin_is_plugin_enabled()) {
        wp_send_json_error(array('message' => __('Plugin disabled.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }
    check_ajax_referer('hplugin_nonce', 'nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(array('message' => __('Not logged in.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }
    $user_id = get_current_user_id();
    global $wpdb;
    $table_name = $wpdb->prefix . 'hplugin_addresses';

    // Settings
    $settings = get_option('hplugin_settings');
    $max_addresses = isset($settings['max_addresses']) ? intval($settings['max_addresses']) : 3;
    $enable_labels = isset($settings['enable_labels']) && $settings['enable_labels'] == '1';
    $validate_duplicates = isset($settings['validate_duplicates']) && $settings['validate_duplicates'] == '1';

    $address_name = isset($_POST['address_name']) ? sanitize_text_field(wp_unslash($_POST['address_name'])) : '';
    $address_label = isset($_POST['address_label']) ? sanitize_text_field(wp_unslash($_POST['address_label'])) : 'Home';
    $first_name = isset($_POST['first_name']) ? sanitize_text_field(wp_unslash($_POST['first_name'])) : '';
    $last_name = isset($_POST['last_name']) ? sanitize_text_field(wp_unslash($_POST['last_name'])) : '';
    $company = isset($_POST['company']) ? sanitize_text_field(wp_unslash($_POST['company'])) : '';
    $address_1 = isset($_POST['address_1']) ? sanitize_text_field(wp_unslash($_POST['address_1'])) : '';
    $address_2 = isset($_POST['address_2']) ? sanitize_text_field(wp_unslash($_POST['address_2'])) : '';
    $city = isset($_POST['city']) ? sanitize_text_field(wp_unslash($_POST['city'])) : '';
    $state = isset($_POST['state']) ? sanitize_text_field(wp_unslash($_POST['state'])) : '';
    if (empty($state) && !empty($_POST['state_input'])) {
        $state = sanitize_text_field(wp_unslash($_POST['state_input']));
    }
    $postcode = isset($_POST['postcode']) ? sanitize_text_field(wp_unslash($_POST['postcode'])) : '';
    $country = isset($_POST['country']) ? sanitize_text_field(wp_unslash($_POST['country'])) : '';
    $phone = isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';
    $email = isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
    // A ticked checkbox is posted as "on" (form serialize), scripts may send "true" or "1".
    $default_flag = isset($_POST['is_default']) ? sanitize_text_field(wp_unslash($_POST['is_default'])) : '';
    $is_default = in_array($default_flag, array('on', 'true', '1'), true) ? 1 : 0;
    $address_id = isset($_POST['address_id']) ? intval($_POST['address_id']) : 0;

    if (empty($address_name) || empty($first_name) || empty($last_name) || empty($address_1) || empty($city) || empty($country)) {
        wp_send_json_error(array('message' => __('Required fields are missing.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }

    // Security: Validate Country
    $allowed_countries = WC()->countries->get_countries();
    if (!array_key_exists($country, $allowed_countries)) {
        wp_send_json_error(array('message' => __('Invalid country selected.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }

    // Security: Validate State. Countries with a state list need a valid state; others take free text.
    $allowed_states = WC()->countries->get_states($country);
    if (!empty($allowed_states) && is_array($allowed_states)) {
        if (empty($state)) {
            wp_send_json_error(array('message' => __('Please select a state.', 'h-shipping-multiple-addresses-for-woocommerce')));
        }
        if (!array_key_exists($state, $allowed_states)) {
            wp_send_json_error(array('message' => __('Invalid state selected.', 'h-shipping-multiple-addresses-for-woocommerce')));
        }
    }

    // Limit Check
    if (!$address_id) {
        $count = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d", $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        if ($count >= $max_addresses) {
            /* translators: %d: maximum number of addresses */
            wp_send_json_error(array('message' => sprintf(esc_html__('You have reached the limit of %d saved addresses.', 'h-shipping-multiple-addresses-for-woocommerce'), intval($max_addresses))));
        }
    }

    // Duplicate Check - Nickname
    $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d AND address_name = %s AND id != %d", $user_id, $address_name, $address_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    if ($existing) {
        wp_send_json_error(array('message' => __('An address with this nickname already exists.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }

    // Duplicate Check - Content (Strict)
    if ($validate_duplicates) {
        $table_name = $wpdb->prefix . 'hplugin_addresses';

        if (!empty($state) && !empty($postcode)) {
            // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery
            $is_duplicate = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d AND first_name = %s AND last_name = %s AND address_1 = %s AND city = %s AND country = %s AND id != %d AND state = %s AND postcode = %s",
                $user_id,
                $first_name,
                $last_name,
                $address_1,
                $city,
                $country,
                $address_id,
                $state,
                $postcode
            ));
        } elseif (!empty($state)) {
            // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery
            $is_duplicate = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d AND first_name = %s AND last_name = %s AND address_1 = %s AND city = %s AND country = %s AND id != %d AND state = %s",
                $user_id,
                $first_name,
                $last_name,
                $address_1,
                $city,
                $country,
                $address_id,
                $state
            ));
        } elseif (!empty($postcode)) {
            // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery
            $is_duplicate = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d AND first_name = %s AND last_name = %s AND address_1 = %s AND city = %s AND country = %s AND id != %d AND postcode = %s",
                $user_id,
                $first_name,
                $last_name,
                $address_1,
                $city,
                $country,
                $address_id,
                $postcode
            ));
        } else {
            // phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.DirectDatabaseQuery
            $is_duplicate = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}hplugin_addresses WHERE user_id = %d AND first_name = %s AND last_name = %s AND address_1 = %s AND city = %s AND country = %s AND id != %d",
                $user_id,
                $first_name,
                $last_name,
                $address_1,
                $city,
                $country,
                $address_id
            ));
        }

        if ($is_duplicate) {
            wp_send_json_error(array('message' => __('This address details already exist in your saved addresses.', 'h-shipping-multiple-addresses-for-woocommerce')));
        }
    }

    if ($is_default) {
        $wpdb->update($table_name, array('is_default' => 0), array('user_id' => $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    $data = array(
        'user_id' => $user_id,
        'address_name' => $address_name,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'company' => $company,
        'address_1' => $address_1,
        'address_2' => $address_2,
        'city' => $city,
        'state' => $state,
        'postcode' => $postcode,
        'country' => $country,
        'phone' => $phone,
        'email' => $email,
        'is_default' => $is_default
    );
    if ($enable_labels) {
        $data['address_label'] = $address_label;
    }

    if ($address_id) {
        $wpdb->update($table_name, $data, array('id' => $address_id, 'user_id' => $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $message = __('Address updated successfully.', 'h-shipping-multiple-addresses-for-woocommerce');
    } else {
        $wpdb->insert($table_name, $data); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $message = __('Address saved successfully.', 'h-shipping-multiple-addresses-for-woocommerce');
    }
    wp_send_json_success(array('message' => $message));
}
/**
 * AJAX Handler: Delete Address
 */
function hplugin_ajax_delete_address()
{
    if (!hplugin_is_plugin_enabled()) {
        wp_send_json_error();
    }
    check_ajax_referer('hplugin_nonce', 'nonce');
    if (!is_user_logged_in())
        wp_send_json_error();
    $address_id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $user_id = get_current_user_id();
    global $wpdb;
    $table_name = $wpdb->prefix . 'hplugin_addresses';
    $result = $wpdb->delete($table_name, array('id' => $address_id, 'user_id' => $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    if ($result) {
        wp_send_json_success(array('message' => __('Address deleted.', 'h-shipping-multiple-addresses-for-woocommerce')));
    } else {
        wp_send_json_error(array('message' => __('Could not delete address.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }
}
/**
 * AJAX Handler: Get Address
 */
function hplugin_ajax_get_address()
{
    if (!hplugin_is_plugin_enabled()) {
        wp_send_json_error();
    }
    check_ajax_referer('hplugin_nonce', 'nonce');
    if (!is_user_logged_in())
        wp_send_json_error();
    $address_id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $user_id = get_current_user_id();
    global $wpdb;
    $address = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}hplugin_addresses WHERE id = %d AND user_id = %d", $address_id, $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    if ($address) {
        wp_send_json_success($address);
    } else {
        wp_send_json_error();
    }
}
/**
 * AJAX Handler: Set Default
 */
function hplugin_ajax_set_default_address()
{
    if (!hplugin_is_plugin_enabled()) {
        wp_send_json_error();
    }
    check_ajax_referer('hplugin_nonce', 'nonce');
    if (!is_user_logged_in())
        wp_send_json_error();
    $address_id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $user_id = get_current_user_id();
    global $wpdb;
    $table_name = $wpdb->prefix . 'hplugin_addresses';
    // Never clear the current default unless the chosen address really belongs to this user.
    $owned = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}hplugin_addresses WHERE id = %d AND user_id = %d", $address_id, $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    if (!$owned) {
        wp_send_json_error(array('message' => __('Address not found.', 'h-shipping-multiple-addresses-for-woocommerce')));
    }
    $wpdb->update($table_name, array('is_default' => 0), array('user_id' => $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    $wpdb->update($table_name, array('is_default' => 1), array('id' => $address_id, 'user_id' => $user_id)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    wp_send_json_success(array('message' => __('Default address set.', 'h-shipping-multiple-addresses-for-woocommerce')));
}
/**
 * Checkout Integration (classic checkout): saved address picker.
 * Hooked on 'woocommerce_checkout_shipping' so it is shown even while the
 * "Ship to a different address" box is still collapsed.
 */
function hplugin_checkout_shipping_field()
{
    if (!hplugin_is_plugin_enabled()) {
        return;
    }

    // Nothing to pick for orders that do not ship (virtual or downloadable only).
    if (!WC()->cart || !WC()->cart->needs_shipping_address()) {
        return;
    }

    $settings = get_option('hplugin_settings');
    $allow_multiple = isset($settings['allow_multiple_checkout']) && $settings['allow_multiple_checkout'] === '1';

    if (!$allow_multiple) {
        return;
    }

    if (!is_user_logged_in())
        return;
    $addresses = hplugin_get_checkout_addresses(get_current_user_id());
    if ($addresses) {
        echo '<div id="hplugin_checkout_dropdown_field" class="hplugin-checkout-box">';
        echo '<h3 class="hplugin-checkout-title">' . esc_html__('Select from saved addresses', 'h-shipping-multiple-addresses-for-woocommerce') . '</h3>';
        echo '<div class="hplugin-checkout-addresses">';
        echo '<label class="hplugin-address-option selected">';
        echo '<input type="radio" name="hplugin_address_selection" value="0" class="hplugin-address-radio" checked="checked">';
        echo '<span class="hplugin-address-details"><strong>' . esc_html__('New / Different Address', 'h-shipping-multiple-addresses-for-woocommerce') . '</strong></span>';
        echo '</label>';
        foreach ($addresses as $address) {
            $label = '<strong>' . esc_html($address['name']) . '</strong><br>';
            $label .= '<span class="hplugin-addr-summary">' . esc_html($address['first_name'] . ' ' . $address['last_name']) . '</span><br>';
            $label .= '<span class="hplugin-addr-summary">' . esc_html($address['address_1'] . ', ' . $address['city']) . '</span>';
            $address_data = $address;
            unset($address_data['id'], $address_data['name'], $address_data['label'], $address_data['is_default']);
            echo '<label class="hplugin-address-option">';
            echo '<input type="radio" name="hplugin_address_selection" value="' . esc_attr($address['id']) . '" data-address="' . esc_attr(wp_json_encode($address_data)) . '" class="hplugin-address-radio">';
            echo '<span class="hplugin-address-details">' . wp_kses_post($label) . '</span>';
            echo '</label>';
        }
        echo '</div>';
        echo '</div>';
    }
}

/**
 * Start the plugin once WooCommerce is loaded. This file is included before WooCommerce
 * (plugins load alphabetically), so the check must not run at include time.
 */
add_action('plugins_loaded', 'hplugin_bootstrap');
function hplugin_bootstrap()
{
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'hplugin_missing_woocommerce_notice');
        return;
    }

    hplugin_update_db_check();

    add_action('wp_enqueue_scripts', 'hplugin_enqueue_scripts');
    add_filter('woocommerce_account_menu_items', 'hplugin_add_my_account_tab');
    add_action('init', 'hplugin_add_endpoint');
    add_action('template_redirect', 'hplugin_restrict_endpoint_access');
    add_action('woocommerce_account_shipping-addresses_endpoint', 'hplugin_my_account_tab_content');
    add_action('wp_ajax_hplugin_save_address', 'hplugin_ajax_save_address');
    add_action('wp_ajax_hplugin_delete_address', 'hplugin_ajax_delete_address');
    add_action('wp_ajax_hplugin_get_address', 'hplugin_ajax_get_address');
    add_action('wp_ajax_hplugin_set_default_address', 'hplugin_ajax_set_default_address');
    // Outside the "Ship to a different address" box, which WooCommerce hides until it is ticked.
    add_action('woocommerce_checkout_shipping', 'hplugin_checkout_shipping_field', 5);

    if (is_admin()) {
        require_once HPLUGIN_PLUGIN_DIR . 'includes/admin/class-hplugin-settings.php';
        new HPlugin_Settings();
    }
}

function hplugin_missing_woocommerce_notice()
{
    if (!current_user_can('activate_plugins')) {
        return;
    }
    echo '<div class="notice notice-warning"><p>' . esc_html__('H-Shipping Multiple Shipping Addresses for WooCommerce needs WooCommerce to be active.', 'h-shipping-multiple-addresses-for-woocommerce') . '</p></div>';
}
