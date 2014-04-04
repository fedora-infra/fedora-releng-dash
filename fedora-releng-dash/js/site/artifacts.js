$(document).ready(function() {
    // A mapping of fedmsg topic fragments to DOM elements.
    var selectors = {
        'appliance': '#appliance',
        'livecd': '#livecd',
    }

    var get_msg = function(artifact, callback) {
        var data = $.param({
            'delta': 3600000,
            'rows_per_page': 100,
            'order': 'desc',
            'meta': 'link',
            'user': 'masher',
        });
        $.ajax({
            url: "https://apps.fedoraproject.org/datagrepper/raw/",
            data: data,
            dataType: "jsonp",
            success: function(data) {
                callback(data, artifact);
            },
            error: function(data, statusCode) {
                console.log("Status code: " + statusCode);
                console.log(data);
                console.log(data.responseText);
                console.log(data.status);
            }
        });
    }
    var hollaback = function(data, artifact) {
        var selector_prefix = selectors[artifact];
        var seen = [];
        $.each(data.raw_messages, function(i, msg) {
            // We only want artifacts, not other people's scratch builds.
            if (msg.msg.method != artifact) {
                return;
            }

            var tokens = msg.msg.srpm.split('-');
            var arch = tokens[tokens.length - 1];

            // Some of the appliance builds come in different formats.
            // Here we mangle the "srpm" name so that we can distinguish them.
            // Not all tasks have this info, so we have to proceed carefully.
            var info = msg.msg['info'];
            if (info != undefined) {
                var options = info.request[info.request.length - 1];
                if (options.format != undefined) {
                    msg.msg.srpm = msg.msg.srpm + " (" + options.format + ")";
                }
            }

            // We only want to process srpms once.  Have seen already?
            if ($.inArray(msg.msg.srpm, seen) != -1) {
                // Bail out
                return;
            } else {
                // Throw it in the array so we'll see it next time.
                seen.push(msg.msg.srpm);
            }

            var selector = selector_prefix + "-" + arch;
            var class_lookup = {
                'CLOSED': 'text-primary',
                'FAILED': 'text-danger',
                'OPEN': 'text-warning',
            }
            var text_lookup = {
                'CLOSED': 'completed',
                'FAILED': 'failed',
                'OPEN': 'started',
            }
            var now = moment();
            var one_day_ago = now.subtract('hours', 24);
            var time = moment(msg.timestamp.toString(), '%X');
            var cls = class_lookup[msg.msg.new];
            if (time.isBefore(one_day_ago)) {
                // Because it is old and stale.
                cls = 'text-muted';
            }
            $(selector).append(
                "<p class='" + cls + "'>" +
                msg.msg.srpm + " " +
                "</br>" +
                "<small>" +
                text_lookup[msg.msg.new] +" " +
                time.fromNow() + " " +
                "</small> " +
                "<strong><a href='" + msg.meta.link + "'>(details)</a></strong>" +
                "</p>"
            );
        });
    }

    // Kick off our on page load initialization.
    $.each(selectors, function(name, selector) {
        get_msg(name, hollaback);
    })
});
