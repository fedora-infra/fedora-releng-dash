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

    var artifacts = {
        'appliance': '#appliance',
        'livecd': '#livecd',
    }

    var main_architectures = ["", "arm", "ppc", "s390"];
    var task_architectures = {
        'livecd': ["x86_64", "i686"],
        'appliance': ['x86_64', 'i386', 'armhfp'],
    }

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
                $.each(main_architectures, function(i, arch) {
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
    var main_hollaback = function(data, topic, arch) {
        var content;
        var selector_prefix = selectors[topic];
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

    var get_fedmsg_tasks = function(artifact, callback) {
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
    var task_hollaback = function(data, artifact) {
        var selector_prefix = artifacts[artifact];
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
    $.each(selectors, function(topic, selector) {
        get_fedmsg_msg(topic, main_hollaback);
    });
    $.each(artifacts, function(name, selector) {
        get_fedmsg_tasks(name, task_hollaback);
    })
});
