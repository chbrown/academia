SOURCES := styles/acl.ts names.ts types.ts

all: index.js academia.d.ts

# the dependencies are more formally specified in tsc-declare.json,
# but we specify them here for make's sake
index.js academia.d.ts: $(SOURCES) type_declarations | node_modules/.bin/tsc-declare
	node_modules/.bin/tsc-declare -n academia -f tsc-declare.json

clean:
	rm -f $(SOURCES:%.ts=%.js) $(SOURCES:%.ts=%.d.ts)

# for testing:

DTS := mocha/mocha node/node

type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)

type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/chbrown/DefinitelyTyped/master/$* > $@

node_modules/.bin/tsc node_modules/.bin/mocha node_modules/.bin/tsc-declare:
	npm install
