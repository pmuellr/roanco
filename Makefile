build: test
	@mkdir -p tmp

	@echo running browserify
	@rm roanco-standalone.js
	@node_modules/.bin/browserify \
		--outfile    roanco-standalone.js \
		--entry      lib/standalone.js \
		--debug

	@echo populating /docs for GitHub Pages
	@cp roanco-standalone.js docs

test: standard utest

utest:
	@node $(INSPECT) test/index.js | FORCE_COLOR=1 node_modules/.bin/tap-spec

standard:
	@echo "running standard"
	@node_modules/.bin/standard -v
