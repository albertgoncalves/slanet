package combo

const (
    K = 3
    L = 2 // K - 1
)

func combinations(n int) [][K]int {
    result := make([][K]int, 0)
    var state [K]int
    var closure func(int, int)
    closure = func(j, k int) {
        for i := k; i < n; i++ {
            state[j] = i
            if j == L {
                var combination [K]int = state
                result = append(result, combination)
            } else {
                closure(j+1, i+1)
            }
        }
        return
    }
    closure(0, 0)
    return result
}
