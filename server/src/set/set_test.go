package set

import (
    "testing"
)

func TestCombinations(t *testing.T) {
    for i := -1; i < 3; i++ {
        result := combinations(i)
        if !(0 == len(result)) {
            t.Errorf("len(combinations(%d))", i)
        }
    }
    func() {
        result := combinations(3)
        if !(1 == len(result)) {
            t.Error("len(combinations(3))")
        }
        expected := [K]int{0, 1, 2}
        for i := 0; i < K; i++ {
            if !(result[0][i] == expected[i]) {
                t.Errorf("combinations(3)[0][%d]", i)
                return
            }
        }
    }()
    func() {
        result := combinations(4)
        if !(4 == len(result)) {
            t.Error("len(combinations(4))")
        }
        expected := [4][K]int{
            {0, 1, 2},
            {0, 1, 3},
            {0, 2, 3},
            {1, 2, 3},
        }
        for i := 0; i < 4; i++ {
            for j := 0; j < K; j++ {
                if !(result[i][j] == expected[i][j]) {
                    t.Errorf("combinations(4)[%d][%d]", i, j)
                    return
                }
            }
        }
    }()
    func() {
        result := combinations(5)
        if !(10 == len(result)) {
            t.Error("len(combinations(5))")
        }
        expected := [10][K]int{
            {0, 1, 2},
            {0, 1, 3},
            {0, 1, 4},
            {0, 2, 3},
            {0, 2, 4},
            {0, 3, 4},
            {1, 2, 3},
            {1, 2, 4},
            {1, 3, 4},
            {2, 3, 4},
        }
        for i := 0; i < 10; i++ {
            for j := 0; j < K; j++ {
                if !(result[i][j] == expected[i][j]) {
                    t.Errorf("combinations(5)[%d][%d]", i, j)
                    return
                }
            }
        }
    }()
}

func BenchmarkCombinations(b *testing.B) {
    for i := 0; i < b.N; i++ {
        combinations(78)
    }
}

func TestAllTokens(t *testing.T) {
    var tokens []*Token = AllTokens()
    if len(tokens) != 81 {
        t.Error("len(AllTokens())")
    }
    if (*tokens[0] != Token{
        Shape:     "square",
        Fill:      "solid",
        Color:     "green",
        Frequency: 1,
    }) {
        t.Error("AllTokens()[0]")
    }
    if (*tokens[1] != Token{
        Shape:     "square",
        Fill:      "solid",
        Color:     "green",
        Frequency: 2,
    }) {
        t.Error("AllTokens()[1]")
    }
    if (*tokens[len(tokens)-2] != Token{
        Shape:     "triangle",
        Fill:      "empty",
        Color:     "blue",
        Frequency: 2,
    }) {
        t.Error("AllTokens()[len(AllTokens()) - 2]")
    }
    if (*tokens[len(tokens)-1] != Token{
        Shape:     "triangle",
        Fill:      "empty",
        Color:     "blue",
        Frequency: 3,
    }) {
        t.Error("AllTokens()[len(AllTokens()) - 1]")
    }
}

func TestPop(t *testing.T) {
    expected := Token{
        Shape:     "square",
        Fill:      "solid",
        Color:     "green",
        Frequency: 1,
    }
    if token, err := Pop(); (err != nil) || (*token != expected) ||
        (len(ALL_TOKENS) != 80) {
        t.Error("Pop()")
    }
    ALL_TOKENS = []*Token{}
    if _, err := Pop(); err == nil {
        t.Error("Pop()")
    }
    ALL_TOKENS = AllTokens()
}

func TestInit(t *testing.T) {
    if tokens, err := Init(); (err != nil) || (len(tokens) != 12) ||
        (len(ALL_TOKENS) != 69) {
        t.Error("Init()")
    }
}

func TestValidate(t *testing.T) {
    if !Validate([]*Token{
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "green",
            Frequency: 1,
        },
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "green",
            Frequency: 2,
        },
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "green",
            Frequency: 3,
        },
    }) {
        t.Error("Validate(...)")
    }
    if !Validate([]*Token{
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "green",
            Frequency: 3,
        },
        {
            Shape:     "triangle",
            Fill:      "transparent",
            Color:     "blue",
            Frequency: 2,
        },
        {
            Shape:     "circle",
            Fill:      "empty",
            Color:     "red",
            Frequency: 1,
        },
    }) {
        t.Error("Validate(...)")
    }
    if Validate([]*Token{
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "green",
            Frequency: 1,
        },
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "blue",
            Frequency: 2,
        },
        {
            Shape:     "square",
            Fill:      "solid",
            Color:     "red",
            Frequency: 1,
        },
    }) {
        t.Error("Validate(...)")
    }
}
