/**
 * H-Shipping: saved address picker for the block-based Checkout.
 *
 * The block checkout is rendered by React, so the picker is added to the shipping step once it
 * exists, and the chosen address is written to the WooCommerce cart store.
 */
(function () {
    'use strict';

    if (typeof hplugin_block_vars === 'undefined' || !window.wp || !window.wp.data) {
        return;
    }

    var vars = hplugin_block_vars;
    var BOX_ID = 'hplugin_checkout_dropdown_field';
    var selectedId = '0';
    var queued = false;

    function cartDispatch() {
        return window.wp.data.dispatch('wc/store/cart');
    }

    function cartSelect() {
        return window.wp.data.select('wc/store/cart');
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text) {
            node.textContent = text;
        }
        return node;
    }

    function addressFields(addr) {
        return {
            first_name: addr.first_name,
            last_name: addr.last_name,
            company: addr.company,
            address_1: addr.address_1,
            address_2: addr.address_2,
            city: addr.city,
            state: addr.state,
            postcode: addr.postcode,
            country: addr.country,
            phone: addr.phone
        };
    }

    function choose(id) {
        selectedId = String(id);
        var dispatch = cartDispatch();
        if (!dispatch || !cartSelect()) {
            return; // The cart store is not registered on this page.
        }

        if (selectedId === '0') {
            // Clear the typed-in part, keep the country so shipping rates keep working.
            var current = cartSelect().getCustomerData().shippingAddress || {};
            dispatch.setShippingAddress({
                first_name: '',
                last_name: '',
                company: '',
                address_1: '',
                address_2: '',
                city: '',
                state: current.state || '',
                postcode: '',
                country: current.country || '',
                phone: ''
            });
        } else {
            for (var i = 0; i < vars.addresses.length; i++) {
                if (String(vars.addresses[i].id) === selectedId) {
                    dispatch.setShippingAddress(addressFields(vars.addresses[i]));
                    break;
                }
            }
        }
        markSelected();
    }

    function markSelected() {
        var box = document.getElementById(BOX_ID);
        if (!box) {
            return;
        }
        var options = box.querySelectorAll('.hplugin-address-option');
        for (var i = 0; i < options.length; i++) {
            var input = options[i].querySelector('input');
            var on = input && input.value === selectedId;
            options[i].classList.toggle('selected', !!on);
            if (input) {
                input.checked = !!on;
            }
        }
    }

    function option(id, title, lines) {
        var label = el('label', 'hplugin-address-option');
        var input = el('input', 'hplugin-address-radio');
        input.type = 'radio';
        input.name = 'hplugin_address_selection';
        input.value = String(id);
        label.appendChild(input);

        var details = el('span', 'hplugin-address-details');
        details.appendChild(el('strong', '', title));
        for (var i = 0; i < lines.length; i++) {
            details.appendChild(document.createElement('br'));
            details.appendChild(el('span', 'hplugin-addr-summary', lines[i]));
        }
        label.appendChild(details);
        return label;
    }

    function build() {
        var box = el('div', 'hplugin-checkout-box');
        box.id = BOX_ID;
        box.appendChild(el('h3', 'hplugin-checkout-title', vars.i18n.title));

        var list = el('div', 'hplugin-checkout-addresses');
        list.appendChild(option(0, vars.i18n.new_address, []));
        vars.addresses.forEach(function (addr) {
            var title = addr.name;
            if (vars.labels_enabled && addr.label) {
                title += ' (' + addr.label + ')';
            }
            list.appendChild(option(addr.id, title, [
                addr.first_name + ' ' + addr.last_name,
                addr.address_1 + ', ' + addr.city
            ]));
        });
        box.appendChild(list);
        return box;
    }

    /**
     * The element the picker goes in front of: the address form, or the saved-address card that
     * WooCommerce shows instead of the form for customers who already have an address.
     */
    function findAnchor(step) {
        return step.querySelector('.wc-block-components-address-form-wrapper') ||
            step.querySelector('.wc-block-components-address-card') ||
            step.querySelector('.wc-block-components-checkout-step__content > *');
    }

    function ensure() {
        queued = false;
        var step = document.querySelector('.wp-block-woocommerce-checkout-shipping-address-block');
        if (!step || step.querySelector('#' + BOX_ID)) {
            return;
        }
        var anchor = findAnchor(step);
        if (!anchor || !anchor.parentNode) {
            return; // The step is still rendering.
        }
        anchor.parentNode.insertBefore(build(), anchor);
        markSelected();
    }

    // React re-renders the checkout often, so make sure the picker is still there afterwards.
    function schedule() {
        if (!queued) {
            queued = true;
            window.requestAnimationFrame(ensure);
        }
    }

    // Delegated on the document: React may replace the picker's nodes, which would drop
    // listeners attached to the radios themselves.
    document.addEventListener('change', function (event) {
        var target = event.target;
        if (target && target.name === 'hplugin_address_selection') {
            choose(target.value);
        }
    });

    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
})();
