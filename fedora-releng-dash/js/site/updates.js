$(document).ready(function() {
    // A mapping of fedmsg topic fragments to DOM elements.
    var selectors = {
        'fedora': '#updates-fedora',
        'epel': '#updates-epel',
    }
    var topic_prefix = 'org.fedoraproject.prod.bodhi';
    var get_msg = function(product, callback) {
        var topic = topic_prefix + '.updates.' + product + '.sync';
        var data = $.param({
            'delta': 2000000,  // 23 days
            'rows_per_page': 100,
            'order': 'desc',
            'meta': 'link',
            'topic': topic,
        });
        $.ajax({
            url: "https://apps.fedoraproject.org/datagrepper/raw/",
            data: data,
            dataType: "jsonp",
            success: function(data) {
                callback(data, product);
            },
            error: function(data, statusCode) {
                console.log("Status code: " + statusCode);
                console.log(data);
                console.log(data.responseText);
                console.log(data.status);
            }
        });
    }
    var hollaback = function(data, product) {
        var selector_prefix = selectors[product];
        var seen = [];
        $.each(data.raw_messages, function(i, msg) {
            var release = msg.msg.release;
            var repo = msg.msg.repo;
            var key = release + "-" + repo;

            // We only want to process srpms once.  Have seen already?
            if ($.inArray(key, seen) != -1) {
                // Bail out
                return;
            } else {
                // Throw it in the array so we'll see it next time.
                seen.push(key);
            }

            var selector = selector_prefix + "-" + key;
            var now = moment();
            var one_day_ago = now.subtract('hours', 24);
            var time = moment(msg.timestamp.toString(), '%X');

            var cls = 'text-primary';
            if (time.isBefore(one_day_ago)) {cls = 'text-muted';}

            var content = "synced out<br/>" +
                "<small>" + time.fromNow() +
                " (" + time.calendar() + ")</small>";

            $(selector).addClass(cls)
            $(selector + " .content").html(content);
        });
    }

    // Kick off our on page load initialization.
    $.each(selectors, function(name, selector) {
        get_msg(name, hollaback);
    })
});
