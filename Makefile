BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)

all: $(TYPESCRIPT:%.ts=%.js) $(TYPESCRIPT:%.ts=%.d.ts) .npmignore .gitignore

$(BIN)/tsc $(BIN)/mocha:
	npm install

.npmignore: tsconfig.json
	echo $(TYPESCRIPT) Makefile tsconfig.json tests/ | tr ' ' '\n' > $@

.gitignore: tsconfig.json
	echo $(TYPESCRIPT:%.ts=/%.js) $(TYPESCRIPT:%.ts=/%.d.ts) | tr ' ' '\n' > $@

%.js %.d.ts: %.ts $(BIN)/tsc
	$(BIN)/tsc -d

test: $(BIN)/mocha
	$(BIN)/mocha --compilers js:babel-core/register tests/

clean:
	rm -f $(TYPESCRIPT:%.ts=%.js) $(TYPESCRIPT:%.ts=%.d.ts)
