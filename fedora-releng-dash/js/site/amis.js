$(document).ready(function() {
    // A mapping of fedmsg topic fragments to DOM elements.
    var selectors = {
        'image-upload': '#image-upload',
        // Disabling widget for showing Cloud Images test builds
        // 'image-test': '#image-test'
    }
    var topics = {
      'image-upload': 'org.fedoraproject.prod.fedimg.image.upload',
      'image-test': 'org.fedoraproject.prod.fedimg.image.test'
    };

    var get_msg = function(artifact, callback) {
        var data = $.param({
            'delta': 2000000,  // 23 days
            'rows_per_page': 100,
            'order': 'desc',
            'meta': 'link',
            'topic': topics[artifact],
            'contains': 'completed',
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
        var latest = {
            rawhide: null,
            branched: null,
        };
        $.each(data.raw_messages, function(i, msg) {
            var arch = msg.msg.image_name.split('.')[1];
            var tokens = msg.msg.image_name.split('.')[0].split('-');
            var flavour = tokens[2].toLowerCase();
            var version = tokens[3].toLowerCase();
            var tstamp = tokens[4];
            var ec2_region = msg.msg.destination.split('(')[1].slice(0, -1);


            var branch = version;
            if (branch != 'rawhide' && collections.dev.length > 1) {
                if (branch == collections.dev[1].version) {
                    branch = 'branched';
                }
            }

            if (latest[branch] == null) { latest[branch] = tstamp; }
            if (tstamp < latest[branch]) { return; }

            // We only want to process AMIs once.  Have seen already?
            if ($.inArray(msg.msg.image_name + ec2_region, seen) != -1) {
                // Bail out
                return;
            } else {
                // Throw it in the array so we'll see it next time.
                seen.push(msg.msg.image_name + ec2_region);
            }

            var class_lookup = {
                'completed': 'text-primary',
                'failed': 'text-danger',
                'started': 'text-warning',
            }
            var now = moment();
            var one_day_ago = now.subtract('hours', 24);
            var time = moment(msg.timestamp.toString(), '%X');
            var cls = class_lookup[msg.msg.status];
            if (time.isBefore(one_day_ago)) {
                // Because it is old and stale.
                cls = 'text-muted';
            }
            var amiLink = "https://redirect.fedoraproject.org/console.aws." +
                          "amazon.com/ec2/v2/home?region=" +
                          ec2_region +
                          "#LaunchInstanceWizard:ami=" +
                          msg.msg.extra.id;

            html = "<p class='" + cls + "'>" +
                msg.msg.image_name + " " +
                "</br>" +
                "<small>" +
                msg.msg.status +" " +
                time.fromNow() + " " +
                "</small>" +
                "<a href=\"" + amiLink + "\">" +
                msg.msg.destination + "</a></p>";

            selector = selector_prefix + "-" + flavour + "-" + branch;
            $(selector).append(html);
        });
    }

    // Kick off our on page load initialization.
    $.each(selectors, function(name, selector) {
        get_msg(name, hollaback);
    })
});
