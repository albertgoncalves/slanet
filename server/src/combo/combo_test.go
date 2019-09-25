package combo

import (
    "testing"
)

func TestCombinations(t *testing.T) {
    func() {
        result := combinations(1)
        if 0 < len(result) {
            t.Error("combinations(2)")
        }
    }()
    func() {
        result := combinations(2)
        if 0 < len(result) {
            t.Error("combinations(2)")
        }
    }()
    func() {
        result := combinations(3)
        expected := [K]int{0, 1, 2}
        for i := 0; i < K; i++ {
            if !(result[0][i] == expected[i]) {
                t.Error("combinations(3)")
                return
            }
        }
    }()
    func() {
        result := combinations(4)
        expected := [4][K]int{
            {0, 1, 2},
            {0, 1, 3},
            {0, 2, 3},
            {1, 2, 3},
        }
        for i := 0; i < 4; i++ {
            for j := 0; j < K; j++ {
                if !(result[i][j] == expected[i][j]) {
                    t.Error("combinations(4)")
                    return
                }
            }
        }
    }()
    func() {
        result := combinations(5)
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
                    t.Error("combinations(5)")
                    return
                }
            }
        }
    }()
}
