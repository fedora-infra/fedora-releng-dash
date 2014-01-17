%global prefix /srv/web

Name:           fedora-releng-dash
Version:        0.3
Release:        1%{?dist}
Summary:        An HTML5 readonly dashboard for Fedora Release Engineering

License:        MIT
URL:            http://github.com/fedora-infra/fedora-releng-dash
# Use "./make-release.sh" from a git snapshot
# Please update the version number liberally.
Source0:        %{name}-%{version}.tar.gz

BuildArch:      noarch

# Needed in order to get httpd's uid/gid.
BuildRequires:  httpd

%description
This is static HTML, CSS, and javascript site for showing the current status of
Fedora Release Engineering.  The javascript queries the datagrepper API at
pageload to get its data.

%prep
%setup -q

%build
# Nada

%install
mkdir -p %{buildroot}/%{prefix}/%{name}
cp -r %{name}/{index.html,assets,css,js} %{buildroot}/%{prefix}/%{name}/.

%files
%doc README.rst LICENSE
%{prefix}/%{name}/
%attr(755, httpd, httpd) %dir %{prefix}/%{name}/

%changelog
* Fri Jan 17 2014 Ralph Bean <rbean@redhat.com> - 0.3-1
- Added livecd and appliance images.

* Fri Sep 06 2013 Ralph Bean <rbean@redhat.com> - 0.2-1
- Fix source link in the footer.

* Fri Sep 06 2013 Ralph Bean <rbean@redhat.com> - 0.1-1
- Initial packaging.
