/**
 *
 * Dummy contract for us to create new blocks on testrpc
 * (recall that on testrpc blocks are created per transaction)
 * 
 * NOT PART OF AUDIT
 */
contract DummyMock {
    uint256 public counter;

    function increment() {
        counter = counter + 1;
    }
}