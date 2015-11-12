Moda Provider Reports
==========================
Stack

* [Compass] (http://compass-style.org/) compass library
* [Sass] (http://sass-lang.com/) precompiled css
* [Modular Scale] (http://modularscale.com/) modular scale for typography
* [Angular] (http://angularjs.org) thick-client framework
* [Node and NPM] (http://nodejs.org) server-side JS environment and package manager
* [Bower] (http://bower.io) package manager for client-side libraries and frameworks
* [Grunt] (http://gruntjs.com) JS task runner / asset pipeline

Project uses Grunt for the development and build toolchain, Sass for preprocessed CSS features and modularity, and Angular for the MV* thick client

initial setup
------------
* system requirements 
** [ruby-1.9.3] (https://www.ruby-lang.org/en/documentation/installation/#installers). On Windows, use Rubyinstaller
** node/npm - Installer for your OS from the site, also installs npm
** git - Installer for your OS from [Git] (http://git-scm.com)
** bower - npm install -g bower (global)
** grunt - npm install -g grunt-cli

* even if ruby is already installed this tutorial walks through installation of [DevKit](https://sites.google.com/site/sproutframework/system-setup/windows)
* other information regarding DevKit, installation, troubleshooting [here](https://github.com/oneclick/rubyinstaller/wiki/Development-Kit)
* options for upgrading ruby
[here] (http://brettklamer.com/diversions/non-statistical/install-middleman-on-windows/)
and [here] (http://brettklamer.com/diversions/non-statistical/install-eventmachine-in-ruby-2-for-windows/)

Update your RubyGems to avoid SSH error issues: 

* [Rubygems] (https://github.com/rubygems/rubygems)
* [Instructions] (https://gist.github.com/luislavena/f064211759ee0f806c88)

* All installations should be done in a way that gets the necessary pieces on your path (Git, Ruby, Node/NPM), so that you can issue all commands from the shell of your choice

installation
------------
* cd into your sites directory, then, in bash (will create a new directory for the project):

```bash
        git clone |this project|
```

* cd into the build directory (submodule) and then:

```bash
        git checkout master
```

* you may want a local branch, in which case, in both the root and build directories:

```bash
        git checkout -b |your new branch|
```

* go to the root of your project

* install the bundler gem

```bash
        gem install bundler
```

* get all required gems/dependencies installed:

```bash
        bundle install
```

* finally, again at the root of your project

```bash
        bower install && npm install
```


working
-------

* to run your project locally

```bash
        grunt serve
```

(You will need to change the IP from 0.0.0.0 to localhost, 127.0.0.1, your IPV4, or your machine name, and keep port 9000)

* All code changes should be made within the "app" folder

* on making code changes, the browser should refresh (and if it doesn't, save a root html or js file again, no changes necessary; plus you may need to wait a bit)

building and deploying
----------------------
* to rebuild the build directory, from the root directory:

```bash
        grunt build
```

See Gemfile and config.rb for various required gems, which should be handled by bundle install

troubleshooting
----------------

most things come down to bower install, npm install, or bundle install (if something's changed an is missing in the dev environment)

helpful links
-----------------
*  [sass docs](http://sass-lang.com/documentation/file.SASS_REFERENCE.html)
