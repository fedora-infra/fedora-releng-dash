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

            // If possible, construct a direct download link to the product of
            // the livecd or appliance build.  This is pretty ugly.
            var children = info['children'];
            var SRPM = msg.msg.srpm;
            if (msg.msg.new == 'CLOSED' && children != undefined && children.length == 1) {
                var id = children[0]['id'];
                var result = info['result'].split(" ");
                result = result[result.length - 1];
                tokens = result.split('/');

                // Let's be clear.. I don't know what this is.
                var thing = tokens[5];

                var r = info['request'];
                var opts = r[5];

                var file = r[0] + "-" + r[1] + "-" + opts['release'];

                if (opts['format'] === undefined) {
                    file = file + ".iso";
                } else if (opts['format'] == 'qcow2') {
                    file = file + "-sda.qcow2";
                } else if (opts['format'] == 'raw') {
                    file = file + "-sda.raw.xz";
                }

                var base = "http://kojipkgs.fedoraproject.org/work/tasks/";

                var download_link = base + thing + "/" + id + "/" + file;
                "4886/6714886/Fedora-Live-LXDE-x86_64-rawhide-20140407.iso"

                SRPM = "<a href='" + download_link + "'>" + SRPM + "</a>";
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
                SRPM + " " +
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
