$(document).ready(function() {
    // A mapping of fedmsg topic fragments to DOM elements.
    var compose_selectors = {
        "org.fedoraproject.prod.compose.rawhide.mash": "#rawhide-mash",
        "org.fedoraproject.prod.compose.rawhide.pungify": "#rawhide-pungify",
        "org.fedoraproject.prod.compose.rawhide.rsync": "#rawhide-rsync",
        "org.fedoraproject.prod.compose.rawhide": "#rawhide-compose",

        /* We currently don't have a 'branched' branch.  restore this later..
        "org.fedoraproject.prod.compose.branched.mash": "#branched-mash",
        "org.fedoraproject.prod.compose.branched.pungify": "#branched-pungify",
        "org.fedoraproject.prod.compose.branched.rsync": "#branched-rsync",
        "org.fedoraproject.prod.compose.branched": "#branched-compose",
        */

        /* For whatever reason, epelbeta doesn't have these messages..
        "org.fedoraproject.prod.compose.epelbeta.mash": "#epelbeta-mash",
        "org.fedoraproject.prod.compose.epelbeta.pungify": "#epelbeta-pungify",
        "org.fedoraproject.prod.compose.epelbeta.rsync": "#epelbeta-rsync",
        */
        "org.fedoraproject.prod.compose.epelbeta": "#epelbeta-compose",
    }

    var compose_architectures = ["", "arm", "ppc", "s390"];

    var get_compose_msg = function(topic, callback) {
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
                $.each(compose_architectures, function(i, arch) {
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

    var compose_hollaback = function(data, topic, arch) {
        var content;
        var selector_prefix = compose_selectors[topic];
        var selector = selector_prefix + "-" + arch;
        var latest_msg_start, latest_msg_complete;

        $.each(data.raw_messages, function(i, msg) {
            // Assign the blank string to this field if it is undefined.
            // Not all messages are nicely formed.  epel messages particularly.
            msg.msg.arch = msg.msg.arch || "";
        });

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
        if (latest_msg_complete === undefined && latest_msg_start === undefined) {
            return ui_update(selector, "text-danger", "(no info found)");
        }

        // If we're missing one of our message types, then fake out the
        // timestamp and claim that it occured at the beginning of the epoch.
        if (latest_msg_complete === undefined) {
            latest_msg_complete = {timestamp: new Date(0)};
        }
        if (latest_msg_start === undefined) {
            latest_msg_start = {timestamp: new Date(0)};
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
    $.each(compose_selectors, function(topic, selector) {
        get_compose_msg(topic, compose_hollaback);
    });
});
