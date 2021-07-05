// SPDX-License-Identifier: MIT

pragma solidity >= 0.7.0 < 0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract BookCharity {

  // our structure for each book
  struct Book {
    string book_name;
    string cover_photo;
    string description;
    uint price;
    uint sales;
  }

  // length of books
  uint public booksLength = 0;
  
  // total amount of sales that have occured
  uint public booksSold = 0;

  // total amount donated to charity cause
  uint public amountDonated = 0;
  
  address payable public charity_owner;
  
  // cusd token address
  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

  // maps an integer to a book
  mapping (uint => Book) internal books;

  event addBookEvent(
    string book_name,
    string cover_photo,
    string description,
    uint price,
    uint sales
  );

  event buyBookEvent(
    string book_name,
    uint price,
    uint sales,
    address buyer
  );

  event donateEvent(
    address donator,
    uint amount
  );
  
  constructor(){
    charity_owner = payable(msg.sender);
  }

  modifier ownerOnly {
    // ensure only charity owner can add a books
    require(msg.sender == charity_owner, "Only owner can add a book");
    _;
  }

  function increaseBookLength() internal {
    // increase the number of books by one
    booksLength++;
  }

  function increaseBookSold() internal {
    // increment number of books sold
    booksSold++;
  }

  function increaseAmountDonated(uint _amount) internal {
    // increase amount donated to charity
    amountDonated += _amount;
  }

  // thiis functionality adds a new book to the blockhain
  function addBook(
    string memory _book_name,
    string memory _cover_photo,
    string memory _description,
    uint _price
  ) ownerOnly public {
    // declare number of sales to be 0
    uint _sales = 0;
    
    // add new book to the contract
    Book memory newBook = Book(
      _book_name,
      _cover_photo,
      _description,
      _price,
      _sales
    );
    books[booksLength] = newBook;

    increaseBookLength();

    // execute the addBookEvent
    emit addBookEvent(
      newBook.book_name,
      newBook.cover_photo,
      newBook.description,
      newBook.price,
      newBook.sales
    );
  }

  // fetch a particular book
  function fetchBook(
    uint _index
  ) public view returns (
    string memory book_name, 
    string memory cover_photo,
    string memory description, 
    uint price, 
    uint sales
  ) {
    Book storage book = books[_index];
    return (
      book.book_name, 
      book.cover_photo, 
      book.description, 
      book.price,
      book.sales
    );
  }

  // donate to charity by buying a book
  function buyBook(
    uint _index,
    uint _price
  ) public payable {
    Book storage book = books[_index];

    // pay book price to owner
    require(
      IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        charity_owner,
        _price
      ),
      "Failed to donate to charity by buying a book."
    );
    
    // increment book number of sales
    book.sales++;

    increaseBookSold();
    increaseAmountDonated(_price);

    // execute the buyBookEvent
    emit buyBookEvent(
      book.book_name,
      book.price,
      book.sales,
      msg.sender
    );
  }
    
  // donate directly to a charitable cause without buying a book
    function donate(uint _amount) public payable  {
    require(
      IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        charity_owner,
        _amount
      ),
      "Failed to donate to charity."
    );
    
    increaseAmountDonated(_amount);

    // execute the donateEvent
    emit donateEvent(
      msg.sender,
      _amount
    );
  }
}