#!/bin/bash

# Enable negative glob
shopt -s extglob

VERSION=0.8

rm -rf build
mkdir -p build/fedora-releng-dash-$VERSION
mkdir -p dist
cp -r !(build|dist) build/fedora-releng-dash-$VERSION/.
rm -rf build/fedora-releng-dash-$VERSION/{build,dist}
pushd build
tar -czvf ../dist/fedora-releng-dash-$VERSION.tar.gz fedora-releng-dash-$VERSION
popd

echo Wrote dist/fedora-releng-dash-$VERSION.tar.gz
