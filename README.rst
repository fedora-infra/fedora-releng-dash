Fedora Releng Dash
==================

An html5 dashboard for Fedora Release Engineering.

- Production: https://apps.fedoraproject.org/releng-dash/
- Staging: https://apps.stg.fedoraproject.org/releng-dash/

You can find lists of images being built in koji with this search:  http://koji.fedoraproject.org/koji/tasks?state=all&view=tree&method=image&order=-id

Rewrite in progress
-------------------

The `statscache branch
<https://github.com/fedora-infra/fedora-releng-dash/tree/statscache>`_ contains
a full rewrite by @rtnpro to have the dash use the nascent statscache service
instead of datagrepper directly.  We're going to eventually move to it, so new
features should be directed there.  Statscache isn't live in production yet
though, so we're keeping the develop branch around for bugfixes.

See `#20 <https://github.com/fedora-infra/fedora-releng-dash/pull/20>`_ for
more information, as well as the `statscache
<https://github.com/fedora-infra/statscache/>`_ and `statscache_plugins
<https://github.com/fedora-infra/statscache/>`_ repos.
