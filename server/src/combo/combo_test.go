package combo

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
        combinations(9)
    }
}
