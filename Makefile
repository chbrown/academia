BIN := node_modules/.bin
TYPESCRIPT := styles/acl.ts index.ts names.ts types.ts

all: $(TYPESCRIPT:%.ts=%.js) $(TYPESCRIPT:%.ts=%.d.ts)

$(BIN)/tsc $(BIN)/mocha:
	npm install

%.js %.d.ts: %.ts $(BIN)/tsc
	$(BIN)/tsc -d

test: $(BIN)/mocha
	$(BIN)/mocha --compilers js:babel-core/register tests/
