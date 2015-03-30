%global prefix /srv/web

Name:           fedora-releng-dash
Version:        1.0
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
* Mon Mar 30 2015 Ralph Bean <rbean@redhat.com> - 1.0-1
- Query pkgdb to figure out the branched/active status.
- Show AMIs and cloud images both
- Add vagrant and docker images.

* Mon Dec 15 2014 Ralph Bean <rbean@redhat.com> - 0.15-1
- Removed branched/f21 now that f21 is out the door.

* Fri Aug 08 2014 Ralph Bean <rbean@redhat.com> - 0.13-1
- Distinguish between rawhide and f21 for cloud images.

* Wed Aug 06 2014 Ralph Bean <rbean@redhat.com> - 0.12-1
- Distinguish between rawhide and f21 for livecds.

* Fri Jul 18 2014 Ralph Bean <rbean@redhat.com> - 0.11-1
- Uncomment sections for 'branched' now that we have f21 composes.

* Fri Jun 13 2014 Ralph Bean <rbean@redhat.com> - 0.10-1
- Add other fedora-cloud builds besides just -base.

* Fri May 30 2014 Ralph Bean <rbean@redhat.com> - 0.9-1
- Move the i686 lives next to the x86_64 ones.

* Fri May 30 2014 Ralph Bean <rbean@redhat.com> - 0.8-1
- Add cloud images.

* Mon Apr 07 2014 Ralph Bean <rbean@redhat.com> - 0.7-1
- Inline anchor links
- Loading indicator
- Direct download links for livecd and appliance

* Fri Apr 04 2014 Ralph Bean <rbean@redhat.com> - 0.5-1
- Added bodhi update ftpsync messages.
- Reorganized the js to be easier to maintain.
- Use fedora-bootstrap.

* Sun Jan 19 2014 Ralph Bean <rbean@redhat.com> - 0.4-1
- Added epelbeta messages
- Removed branched messages
- Fixed some formatting to livecd and appliance images.

* Fri Jan 17 2014 Ralph Bean <rbean@redhat.com> - 0.3-1
- Added livecd and appliance images.

* Fri Sep 06 2013 Ralph Bean <rbean@redhat.com> - 0.2-1
- Fix source link in the footer.

* Fri Sep 06 2013 Ralph Bean <rbean@redhat.com> - 0.1-1
- Initial packaging.
