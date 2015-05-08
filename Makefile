SOURCES := styles/acl.ts names.ts types.ts

all: index.js academia.d.ts

# the dependencies are more formally specified in tsc-declare.json,
# but we specify them here for make's sake
index.js academia.d.ts: $(SOURCES)
	tsc-declare -n academia -f tsc-declare.json

clean:
	rm -f $(SOURCES:%.ts=%.js) $(SOURCES:%.ts=%.d.ts)
