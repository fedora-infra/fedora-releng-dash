$(document).ready(function() {
    // Hotpatch an 'endsWith' utility on the native String class... but
    // only if no one else has done so already.
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }

    // A mapping of fedmsg topic fragments to DOM elements.
    var selectors = {
        "org.fedoraproject.prod.compose.rawhide.mash": "#rawhide-mash",
        "org.fedoraproject.prod.compose.rawhide.pungify": "#rawhide-pungify",
        "org.fedoraproject.prod.compose.rawhide.rsync": "#rawhide-rsync",
        "org.fedoraproject.prod.compose.rawhide": "#rawhide-compose",

        "org.fedoraproject.prod.compose.branched.mash": "#branched-mash",
        "org.fedoraproject.prod.compose.branched.pungify": "#branched-pungify",
        "org.fedoraproject.prod.compose.branched.rsync": "#branched-rsync",
        "org.fedoraproject.prod.compose.branched": "#branched-compose",
    }

    var architectures = ["", "ppc", "s390"];

    var get_fedmsg_msg = function(topic, callback) {
        var data = $.param({
            'delta': 3600000,
            'rows_per_page': 100,
            'order': 'desc',
            //'meta': 'link',
        });
        $.ajax({
            url: "https://apps.fedoraproject.org/datagrepper/raw/",
            data: data + '&topic=' + topic + '.start&topic=' + topic + '.complete',
            dataType: "jsonp",
            success: function(data) {
                $.each(architectures, function(i, arch) {
                    callback(data, topic, arch);
                });
            },
            error: function(data, statusCode) {
                console.log("Status code: " + statusCode);
                console.log(data);
                console.log(data.responseText);
                console.log(data.status);
            }
        });
    };
    var hollaback = function(data, topic, arch) {
        var content;
        var selector_prefix = selectors[topic];
        var selector = selector_prefix + "-" + arch;
        var latest_msg_start, latest_msg_complete;
        $.each(data.raw_messages, function(i, msg) {
            if (msg.topic.endsWith('.start') && msg.msg.arch == arch) {
                latest_msg_start = msg;
                return false;
            }});
        $.each(data.raw_messages, function(i, msg) {
            if (msg.topic.endsWith('.complete') && msg.msg.arch == arch) {
                latest_msg_complete = msg;
                return false;
            }});

        // First, check if datagrepper returned nothing (impossible!)
        if (latest_msg_complete === undefined || latest_msg_start === undefined) {
            console.log(selector);
            console.log(latest_msg_start);
            console.log(latest_msg_complete);
            return ui_update(selector, "text-danger", "errored..");
        }

        var now = moment();
        var twenty_hours_ago = now.subtract('hours', 20);

        var latest_start = moment(latest_msg_start.timestamp.toString(), '%X');
        var latest_complete = moment(latest_msg_complete.timestamp.toString(), '%X');

        var content, cls;

        // Then, cover all the scenarios we want to cover.
        if (latest_start.isAfter(latest_complete)) {
            // If there is a start more recent than a complete, then we're
            // probably still doing the process right now.  Mark it as "in
            // progress".
            cls = "text-warning";
            content = make_started_content(latest_start);
        } else if (latest_complete.isBefore(twenty_hours_ago)) {
            // If the last completion was over this long ago, then mark it
            // "gray" indicating stale or outdated.
            cls = "text-muted";
            content = make_completed_content(latest_complete);
        } else {
            // Otherwise we're completed.. and recent.  :)
            cls = "text-primary";
            content = make_completed_content(latest_complete);
        }
        ui_update(selector, cls, content);
    };

    var make_completed_content = function(t) {
        return "<small>completed " + t.fromNow() + " (" + t.calendar() + ")</small>";
    }

    var make_started_content = function(t) {
        return "<small>started " + t.fromNow() + " (" + t.calendar() + ")</small>";
    }

    var ui_update = function(selector, cls, content) {
        // TODO -- remove any other classes

        $(selector + " > p").addClass(cls);
        $(selector + " > p > .content").html(content);
    };

    // Kick off our on page load initialization.
    $.each(selectors, function(topic, selector) {
        get_fedmsg_msg(topic, hollaback);
    });
});
