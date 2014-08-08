$(document).ready(function() {
    // A mapping of fedmsg topic fragments to DOM elements.
    var selectors = {
        'image': '#image',
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

                var branch = info.request[5].release;
                if (branch != undefined) {
                    msg.msg.srpm = msg.msg.srpm + " (" + branch + ")";
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

            var selector = selector_prefix + "-" + branch + "-" + arch;
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

            var SRPM = msg.msg.srpm;

            html = "<p class='" + cls + "'>" +
                SRPM + " " +
                "</br>" +
                "<small>" +
                text_lookup[msg.msg.new] +" " +
                time.fromNow() + " " +
                "</small>" +
                "<strong><a href='" + msg.meta.link + "'>(details)</a></strong>"

            // If possible, construct a direct download link to the product of
            // the image build.  This is pretty ugly.

            if (msg.msg.new == 'CLOSED') {
                var children = info['children'];
                var result = info['result'].split(" ");
                result = result[result.length - 1];
                tokens = result.split('/');
                var r = info['request'];
                var opts = r[5];
                var file = r[0] + "-" + r[1] + "-" + opts['release'];
                var base = "https://kojipkgs.fedoraproject.org/work/tasks/";

                // Let's be clear.. I don't know what this is.
                var thing = tokens[5];
                thing = parseInt(thing);

                html = html + "<table class='table'>";
                $.each(info.children, function(i, child) {
                    html = html + "<tr>"
                    $.each(options.format, function(j, format) {
                        var id = child['id'];

                        var folder = thing + "/" + id + "/";
                        var product = file + "." + child.arch + "." + format;
                        var download_link = base + folder + product;
                        var link = "<a href='" + download_link + "'>" +
                            child.arch + "." + format + "</a> ";

                        html = html + "<td>" + link + "</td>";
                    });
                    html = html + "</tr>";

                    // Forbidden magic
                    thing = thing - 1;
                });
                html = html + "</table>";
            }

            html = html + "</p>";

            $(selector).append(html);
        });
    }

    // Kick off our on page load initialization.
    $.each(selectors, function(name, selector) {
        get_msg(name, hollaback);
    })
});
