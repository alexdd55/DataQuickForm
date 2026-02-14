package main

import "testing"

func TestValidateContentJSON(t *testing.T) {
	app := NewApp()

	okRes, err := app.ValidateContent(`{"foo": 1}`, "json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !okRes.Ok {
		t.Fatalf("expected valid JSON, got: %+v", okRes)
	}

	badRes, err := app.ValidateContent("{\n  \"foo\":\n}", "json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if badRes.Ok {
		t.Fatalf("expected invalid JSON")
	}
	if badRes.Line == 0 {
		t.Fatalf("expected line for JSON error, got: %+v", badRes)
	}
}

func TestFormatContentJSON(t *testing.T) {
	app := NewApp()
	res, err := app.FormatContent(`{"foo":1,"bar":{"baz":2}}`, "json")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !res.Ok {
		t.Fatalf("expected ok result: %+v", res)
	}
	expected := "{\n  \"foo\": 1,\n  \"bar\": {\n    \"baz\": 2\n  }\n}"
	if res.Output != expected {
		t.Fatalf("unexpected JSON formatting:\nexpected:\n%s\nactual:\n%s", expected, res.Output)
	}
}

func TestValidateAndFormatXML(t *testing.T) {
	app := NewApp()

	okRes, err := app.ValidateContent(`<root><a>1</a><b/></root>`, "xml")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !okRes.Ok {
		t.Fatalf("expected valid XML, got: %+v", okRes)
	}

	badRes, err := app.ValidateContent("<root><a></root>", "xml")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if badRes.Ok {
		t.Fatalf("expected invalid XML")
	}
	if badRes.Line == 0 {
		t.Fatalf("expected XML line info, got: %+v", badRes)
	}

	formatRes, err := app.FormatContent(`<root><a>1</a><b attr="x">v</b></root>`, "xml")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !formatRes.Ok {
		t.Fatalf("expected formatted XML result: %+v", formatRes)
	}
	if formatRes.Output == "" {
		t.Fatalf("expected formatted XML output")
	}
}
