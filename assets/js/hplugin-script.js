/**
 * H-Shipping: My Account address book and classic checkout address picker.
 * The block checkout picker lives in hplugin-block-checkout.js.
 */
jQuery(document).ready(function ($) {

    var messages = hplugin_vars.messages;

    // Open Modal
    $('#hplugin-add-new-btn').on('click', function (e) {
        e.preventDefault();
        $('#hplugin-address-form')[0].reset();
        $('#hplugin_address_id').val('');
        $('#hplugin-form-title').text(messages.add_title);

        // Reset dynamic fields
        $('#hplugin_country').trigger('change');

        $('#hplugin-address-form-modal').fadeIn();
    });

    // Close Modal
    $('.hplugin-close, .hplugin-cancel-btn').on('click', function () {
        $('#hplugin-address-form-modal').fadeOut();
    });

    // Click outside modal
    $(window).on('click', function (e) {
        if ($(e.target).is('#hplugin-address-form-modal')) {
            $('#hplugin-address-form-modal').fadeOut();
        }
    });

    // Save Address
    $('#hplugin-address-form').on('submit', function (e) {
        e.preventDefault();
        var $form = $(this);
        var $btn = $form.find('button[type="submit"]');
        var originalText = $btn.text();

        $btn.text(messages.saving).prop('disabled', true);

        var data = $form.serialize();
        data += '&action=hplugin_save_address&nonce=' + hplugin_vars.nonce;

        $.post(hplugin_vars.ajax_url, data, function (response) {
            if (response.success) {
                alert(response.data.message);
                location.reload();
            } else {
                alert((response.data && response.data.message) || messages.error);
                $btn.text(originalText).prop('disabled', false);
            }
        }).fail(function () {
            alert(messages.error);
            $btn.text(originalText).prop('disabled', false);
        });
    });

    // Edit Address
    $('.hplugin-edit-btn').on('click', function () {
        var id = $(this).data('id');

        $.post(hplugin_vars.ajax_url, {
            action: 'hplugin_get_address',
            nonce: hplugin_vars.nonce,
            id: id
        }, function (response) {
            if (!response.success) {
                alert(messages.error);
                return;
            }
            var addr = response.data;
            $('#hplugin_address_id').val(addr.id);
            $('#hplugin_address_name').val(addr.address_name);
            $('#hplugin_first_name').val(addr.first_name);
            $('#hplugin_last_name').val(addr.last_name);
            $('#hplugin_company').val(addr.company);
            $('#hplugin_address_label').val(addr.address_label);
            $('#hplugin_country').val(addr.country).trigger('change');

            var states = hplugin_vars.states[addr.country];
            if (states && !$.isEmptyObject(states)) {
                $('#hplugin_state').val(addr.state);
            } else {
                $('#hplugin_state_input').val(addr.state);
            }

            $('#hplugin_city').val(addr.city);
            $('#hplugin_address_1').val(addr.address_1);
            $('#hplugin_address_2').val(addr.address_2);
            $('#hplugin_postcode').val(addr.postcode);
            $('#hplugin_phone').val(addr.phone);
            $('#hplugin_email').val(addr.email);
            $('#hplugin_is_default').prop('checked', addr.is_default == "1");

            $('#hplugin-form-title').text(messages.edit_title);
            $('#hplugin-address-form-modal').fadeIn();
        });
    });

    // Delete Address
    $('.hplugin-delete-btn').on('click', function () {
        if (!confirm(messages.confirm_delete)) {
            return;
        }
        var id = $(this).data('id');
        $.post(hplugin_vars.ajax_url, {
            action: 'hplugin_delete_address',
            nonce: hplugin_vars.nonce,
            id: id
        }, function (response) {
            if (response.success) {
                location.reload();
            } else {
                alert((response.data && response.data.message) || messages.error);
            }
        });
    });

    // Set Default
    $('.hplugin-default-btn').on('click', function () {
        var id = $(this).data('id');
        $.post(hplugin_vars.ajax_url, {
            action: 'hplugin_set_default_address',
            nonce: hplugin_vars.nonce,
            id: id
        }, function (response) {
            if (response.success) {
                location.reload();
            } else {
                alert((response.data && response.data.message) || messages.error);
            }
        });
    });

    // Classic checkout: fill the shipping form from the chosen saved address.
    if ($('form.checkout').length > 0) {

        var fillShipping = function (addr) {
            $('#shipping_first_name').val(addr.first_name);
            $('#shipping_last_name').val(addr.last_name);
            $('#shipping_company').val(addr.company);
            $('#shipping_address_1').val(addr.address_1);
            $('#shipping_address_2').val(addr.address_2);
            $('#shipping_city').val(addr.city);
            $('#shipping_postcode').val(addr.postcode);
            $('#shipping_phone').val(addr.phone);
        };

        $('body').on('change', 'input[name="hplugin_address_selection"]', function () {
            var $this = $(this);
            var addressId = $this.val();

            $('.hplugin-address-option').removeClass('selected');
            $this.closest('.hplugin-address-option').addClass('selected');

            if (addressId === '0' || !addressId) {
                fillShipping({});
                $('#shipping_country').val('').trigger('change');
                $(document.body).trigger('update_checkout');
                return;
            }

            var addr = $this.data('address');
            if (typeof addr === 'string') {
                try {
                    addr = JSON.parse(addr);
                } catch (err) {
                    return;
                }
            }
            if (!addr) {
                return;
            }

            // The shipping fields only exist once "Ship to a different address" is ticked.
            var $different = $('#ship-to-different-address-checkbox');
            if ($different.length && !$different.is(':checked')) {
                $different.prop('checked', true).trigger('change');
            }

            fillShipping(addr);

            // Changing the country rebuilds the state field, so set the state afterwards.
            var stateSet = false;
            var setState = function () {
                if (stateSet) {
                    return;
                }
                stateSet = true;
                $('#shipping_state').val(addr.state).trigger('change');
                $(document.body).trigger('update_checkout');
            };
            $(document.body).one('country_to_state_changed', setState);
            $('#shipping_country').val(addr.country).trigger('change');
            setTimeout(setState, 600);
        });
    }

    // Dynamic Country/State Logic in Modal
    $('#hplugin_country').on('change', function () {
        var country = $(this).val();
        var $stateSelect = $('#hplugin_state');
        var $stateInput = $('#hplugin_state_input');

        var states = hplugin_vars.states[country];

        if (states && !$.isEmptyObject(states)) {
            $stateSelect.empty();
            $stateSelect.append($('<option>').val('').text(messages.select_option));
            $.each(states, function (code, name) {
                $stateSelect.append($('<option>').val(code).text(name));
            });
            $stateSelect.show().prop('required', true);
            $stateInput.hide().prop('required', false).val('');
        } else {
            $stateSelect.hide().prop('required', false);
            $stateInput.show().prop('required', true);
        }
    });

});
