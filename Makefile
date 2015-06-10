BIN := node_modules/.bin
SOURCES := styles/acl.ts names.ts types.ts
DTS := chalk/chalk mocha/mocha node/node yargs/yargs

all: index.js academia.d.ts
type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)

$(BIN)/tsc $(BIN)/mocha $(BIN)/tsc-declare:
	npm install

# the dependencies are more formally specified in tsc-declare.json,
# but we specify them here for make's sake
index.js academia.d.ts: $(SOURCES) type_declarations $(BIN)/tsc-declare
	$(BIN)/tsc-declare -n academia -f tsc-declare.json

clean:
	rm -f $(SOURCES:%.ts=%.js) $(SOURCES:%.ts=%.d.ts)

# for testing / command line usage:

%.js: %.ts type_declarations $(BIN)/tsc
	$(BIN)/tsc -m commonjs -t ES5 $<

type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/chbrown/DefinitelyTyped/master/$* > $@

.PHONY: test
test: test/names.js $(BIN)/mocha
	$(BIN)/mocha test/
